import { createReadStream, createWriteStream, readFileSync, writeFileSync } from "node:fs";
import { Readable, Writable } from "node:stream";
import { finished, pipeline } from "node:stream/promises";
import { Worker } from "node:worker_threads";

import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { describe, expect, it, vi } from "vitest";

import { SharedCache, SharedCacheCapacityError } from "../../src/async-utils/shared-cache.js";
import { TestDirectory } from "../utils/tmp.js";


const encode = (text: string): Uint8Array => new TextEncoder().encode(text);
const decode = (data: Uint8Array | undefined): string | undefined => data && new TextDecoder().decode(data);
const create = (data = 32, maximum = 4096): SharedCache => SharedCache.create({
  initialDataCapacity: data,
  initialMetadataCapacity: 256,
  maxDataCapacity: maximum,
  maxMetadataCapacity: 1 << 20
});
const dependency = (cache: SharedCache, key = "dependency") => ({ key, version: cache.version(key)! });

describe("sharedCache core", () => {
  it("keeps entries valid only while their dependencies keep their version", () => {
    const cache = create();
    cache.set("dependency", encode("1"));
    cache.set("old", encode("old"), { dependencies: [dependency(cache)] });
    expect(cache.has("old")).toBe(true);
    cache.set("dependency", encode("2"));
    expect(cache.has("old")).toBe(false);
    cache.set("new", encode("new"), { dependencies: [dependency(cache)] });
    expect(decode(cache.get("new"))).toBe("new");
    expect(cache.has("old")).toBe(false);
    expect(cache.version("old")).toBeUndefined();
    expect(cache.version("missing")).toBeUndefined();
  });

  it("orders writes and dependency changes in one millisecond across attachments", () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(123);
    try {
      const cache = create();
      const attached = SharedCache.attach(cache.metadata, cache.data);
      cache.set("dependency", encode("initial"));
      for(let index = 0; index < 5; index++){
        cache.set(`old:${index}`, encode("old"), { dependencies: [dependency(cache)] });
        attached.set("dependency", encode(`${index}`));
        cache.set(`new:${index}`, encode("new"), { dependencies: [dependency(cache)] });
        expect(attached.has(`old:${index}`)).toBe(false);
        expect(attached.has(`new:${index}`)).toBe(true);
      }
      cache.clear();
      attached.set("fresh", encode("fresh"));
      expect(cache.has("fresh")).toBe(true);
    } finally {
      now.mockRestore();
    }
  });

  it("clears entries in place and reuses their allocations through existing attachments", () => {
    const cache = create(16, 16);
    const attached = SharedCache.attach(cache.metadata, cache.data);
    cache.clear();
    cache.set("first", new Uint8Array(8));
    cache.set("second", new Uint8Array(8));
    const metadata = cache.metadata;
    const data = cache.data;
    attached.clear();
    cache.clear();
    expect(cache.has("first")).toBe(false);
    expect(cache.has("second")).toBe(false);
    expect(cache.getStats().usedBytes).toBe(0);
    expect(cache.metadata).toBe(metadata);
    expect(cache.data).toBe(data);
    cache.set("replacement", new Uint8Array(16).fill(9));
    expect(attached.get("replacement")).toEqual(new Uint8Array(16).fill(9));
  });

  it("validates dependencies transitively and keeps the version of identical values", () => {
    const cache = create();
    cache.set("input", encode("1"));
    cache.set("derived", encode("same"), { dependencies: [dependency(cache, "input")] });
    cache.set("result", encode("result"), { dependencies: [dependency(cache, "derived")] });
    const version = cache.version("derived");
    cache.set("input", encode("1"));
    expect(cache.has("result")).toBe(true);
    cache.set("input", encode("2"));
    expect(cache.has("derived")).toBe(false);
    expect(cache.has("result")).toBe(false);
    cache.set("derived", encode("same"), { dependencies: [dependency(cache, "input")] });
    expect(cache.version("derived")).toBe(version);
    expect(cache.has("result")).toBe(true);
    cache.set("derived", encode("different"), { dependencies: [dependency(cache, "input")] });
    expect(cache.version("derived")).not.toBe(version);
    expect(cache.has("result")).toBe(false);
  });

  it("compares path dependencies against the version of the recorded timestamp", () => {
    const cache = create();
    const version = cache.recordPathUpdate("/file", 1);
    expect(cache.recordPathUpdate("/file", 1)).toBe(version);
    expect(cache.pathVersion("/file")).toBe(version);
    expect(cache.pathVersion("/missing")).toBeUndefined();
    cache.set("entry", encode("value"), { dependencies: [{ path: "/file", version }, { path: "/other", version: cache.recordPathUpdate("/other", -1) }] });
    expect(cache.has("entry")).toBe(true);
    expect(cache.pathDependencies("entry").sort()).toEqual(["/file", "/other"]);
    expect(cache.pathDependencies("missing")).toEqual([]);
    expect(cache.getStats().entries).toBe(1);
    expect(cache.recordPathUpdate("/file", 2)).not.toBe(version);
    expect(cache.has("entry")).toBe(false);
    cache.recordPathUpdate("/file", 1);
    expect(cache.has("entry")).toBe(false);
    expect(cache.pathDependencies("entry").sort()).toEqual(["/file", "/other"]);
    cache.set("missing", encode("value"), { dependencies: [{ path: "/unknown", version: 1 }] });
    expect(cache.has("missing")).toBe(false);
  });

  it("frees all metadata of deleted entries and cleared paths for reuse", () => {
    const cache = SharedCache.create({ initialDataCapacity: 32, initialMetadataCapacity: 4096, maxDataCapacity: 32, maxMetadataCapacity: 4096 });
    for(let index = 0; index < 1000; index++){
      const path = `/files/${index}`;
      cache.set(`key:${index}`, encode("value"), { dependencies: [{ path, version: cache.recordPathUpdate(path, index) }] });
      expect(cache.has(`key:${index}`)).toBe(true);
      cache.delete(`key:${index}`);
      if(index % 10 === 0){
        cache.clear();
      }
    }
    expect(cache.getStats().metadataCapacity).toBe(4096);
    cache.clear();
    expect(cache.getPathLastModified("/files/999")).toBeUndefined();
  });

  it("rejects clock exhaustion instead of losing version ordering", () => {
    const cache = create();
    cache.set("entry", encode("value"));
    new DataView(cache.metadata).setFloat64(40, Number.MAX_SAFE_INTEGER, true);
    expect(() => cache.set("other", encode("other"))).toThrow(/clock exhausted/);
    expect(() => cache.set("entry", encode("new"))).toThrow(/clock exhausted/);
    expect(decode(cache.get("entry"))).toBe("value");
  });

  it("shares reset requests across attachments", () => {
    const cache = create();
    const attached = SharedCache.attach(cache.metadata, cache.data);
    expect(cache.resetRequested).toBe(false);
    attached.requestReset();
    expect(cache.resetRequested).toBe(true);
  });

  it("throws a dedicated error when a buffer would exceed its maximum capacity", () => {
    const cache = create(8, 8);
    expect(() => cache.set("key", new Uint8Array(16))).toThrow(SharedCacheCapacityError);
  });

  it("shares indexed keys across attachments, grows metadata, and returns copies", () => {
    const cache = create();
    const attached = SharedCache.attach(cache.metadata, cache.data);
    for(let index = 0; index < 100; index++){
      cache.set(`key:${index}`, encode(`value:${index}`));
    }
    for(let index = 0; index < 100; index++){
      expect(decode(attached.get(`key:${index}`))).toBe(`value:${index}`);
    }
    attached.get("key:0")!.fill(0);
    expect(decode(cache.get("key:0"))).toBe("value:0");
    expect(cache.metadata.byteLength).toBeGreaterThan(256);
    expect(cache.delete("key:0")).toBe(true);
    expect(attached.has("key:0")).toBe(false);
    expect(cache.delete("key:0")).toBe(false);
  });

  it("invalidates dependents and paths and reclaims stale storage before growth", () => {
    const cache = create(16, 16);
    cache.recordPathUpdate("/file", 1);
    cache.set("dependency", new Uint8Array(0));
    cache.set("dependent", new Uint8Array(8), { dependencies: [dependency(cache)] });
    cache.set("file", new Uint8Array(8), { path: "/file" });
    cache.delete("dependency");
    cache.recordPathUpdate("/file", 2);
    expect(cache.get("dependent")).toBeUndefined();
    expect(cache.has("file")).toBe(false);
    expect(cache.isStale("file")).toBe(true);
    cache.set("replacement", new Uint8Array(16).fill(7));
    expect(cache.getStats().dataCapacity).toBe(16);
    expect(cache.getStats().entries).toBe(1);
    expect(cache.get("replacement")).toEqual(new Uint8Array(16).fill(7));
  });

  it("splits and coalesces extents without moving unrelated payloads", () => {
    const cache = create(24, 24);
    cache.set("first", new Uint8Array(8).fill(1));
    cache.set("second", new Uint8Array(8).fill(2));
    cache.set("third", new Uint8Array(8).fill(3));
    cache.delete("first");
    cache.delete("second");
    cache.set("combined", new Uint8Array(12).fill(4));
    expect(cache.getStats().freeBytes).toBe(4);
    expect(cache.get("third")).toEqual(new Uint8Array(8).fill(3));
  });

  it("preserves valid entries when a payload can never fit", () => {
    const cache = create(8, 8);
    cache.set("key", encode("original"));
    expect(() => cache.set("key", encode("too large"))).toThrow(/capacity/);
    expect(decode(cache.get("key"))).toBe("original");
    expect(cache.getStats().writingEntries).toBe(0);
  });

  it("combines free storage with the unused buffer tail before growing", () => {
    const cache = create(16, 16);
    cache.set("old", new Uint8Array(8));
    cache.delete("old");
    cache.set("new", new Uint8Array(16));
    expect(cache.getStats().dataCapacity).toBe(16);
  });

  it("skips stale dependencies and tracks absent names, exact Unicode keys, and irreversible path changes", () => {
    const cache = create();
    expect(cache.get("missing")).toBeUndefined();
    expect(cache.isStale("missing")).toBe(false);
    expect(cache.getPathLastModified("missing")).toBeUndefined();
    cache.set("\uD800", encode("surrogate"));
    cache.set("\uFFFD", encode("replacement"));
    expect(decode(cache.get("\uD800"))).toBe("surrogate");
    expect(decode(cache.get("\uFFFD"))).toBe("replacement");
    cache.set("key", encode("value"), { dependencies: [{ key: "absent", version: 1 }] });
    expect(cache.has("key")).toBe(false);
    cache.set("path", encode("value"), { path: "/file" });
    cache.recordPathUpdate("/file", 1);
    cache.recordPathUpdate("/file", 0);
    expect(cache.isStale("path")).toBe(true);
    cache.set("fresh", encode("value"), { path: "/file" });
    cache.invalidatePath("/file");
    expect(cache.isStale("fresh")).toBe(true);
    expect(() => cache.recordPathUpdate("/file", NaN)).toThrow(/finite/);
  });

  it("rejects unsupported buffers and exhausted metadata without losing published entries", () => {
    expect(() => SharedCache.attach(new SharedArrayBuffer(256), new SharedArrayBuffer(32))).toThrow(/initialized/);
    expect(() => SharedCache.create({ initialDataCapacity: -1, initialMetadataCapacity: 256, maxDataCapacity: 8, maxMetadataCapacity: 256 })).toThrow(RangeError);
    const cache = SharedCache.create({ initialDataCapacity: 32, initialMetadataCapacity: 512, maxDataCapacity: 32, maxMetadataCapacity: 512 });
    cache.set("key", encode("old"));
    expect(() => cache.set("key", encode("new"), { dependencies: [{ path: "a".repeat(300), version: 0 }] })).toThrow(/capacity/);
    expect(decode(cache.get("key"))).toBe("old");
    expect(cache.getStats().writingEntries).toBe(0);
  });
});

describe("sharedCache eviction", () => {
  it("evicts the least recently used entries when the data buffer is at its maximum", () => {
    const cache = create(24, 24);
    cache.set("first", new Uint8Array(8).fill(1));
    cache.set("second", new Uint8Array(8).fill(2));
    cache.set("third", new Uint8Array(8).fill(3));
    expect(cache.get("first")).toEqual(new Uint8Array(8).fill(1));
    cache.set("fourth", new Uint8Array(8).fill(4));
    expect(cache.has("second")).toBe(false);
    expect(cache.get("first")).toEqual(new Uint8Array(8).fill(1));
    expect(cache.get("third")).toEqual(new Uint8Array(8).fill(3));
    expect(cache.get("fourth")).toEqual(new Uint8Array(8).fill(4));
    cache.set("large", new Uint8Array(16).fill(5));
    expect(cache.get("large")).toEqual(new Uint8Array(16).fill(5));
    expect(cache.getStats().dataCapacity).toBe(24);
  });

  it("treats identical writes and version reads as uses", () => {
    const cache = create(16, 16);
    cache.set("first", new Uint8Array(8).fill(1));
    cache.set("second", new Uint8Array(8).fill(2));
    cache.set("first", new Uint8Array(8).fill(1));
    cache.set("third", new Uint8Array(8).fill(3));
    expect(cache.has("first")).toBe(true);
    expect(cache.has("second")).toBe(false);
    cache.version("first");
    cache.set("fourth", new Uint8Array(8).fill(4));
    expect(cache.has("first")).toBe(true);
    expect(cache.has("third")).toBe(false);
  });

  it("reclaims stale entries before evicting valid ones", () => {
    const cache = create(16, 16);
    cache.set("dependency", new Uint8Array(0));
    cache.set("dependent", new Uint8Array(8), { dependencies: [dependency(cache)] });
    cache.set("valid", new Uint8Array(8).fill(1));
    cache.get("dependent");
    cache.delete("dependency");
    cache.set("new", new Uint8Array(8).fill(2));
    expect(cache.get("valid")).toEqual(new Uint8Array(8).fill(1));
    expect(cache.get("new")).toEqual(new Uint8Array(8).fill(2));
  });

  it("never evicts pinned entries, entries being written, or paths", async () => {
    const cache = create(16, 16);
    const version = cache.recordPathUpdate("/file", 1);
    cache.set("pinned", new Uint8Array(8).fill(1));
    const reader = cache.createReadStream("pinned");
    const writer = cache.createWriteStream("pending", 8);
    expect(() => cache.set("other", new Uint8Array(8))).toThrow(/capacity/);
    expect(cache.get("pinned")).toEqual(new Uint8Array(8).fill(1));
    expect(cache.pathVersion("/file")).toBe(version);
    reader.destroy();
    writer.destroy();
    await Promise.all([finished(reader).catch(() => {}), finished(writer).catch(() => {})]);
    cache.set("other", new Uint8Array(8).fill(2));
    expect(cache.get("other")).toEqual(new Uint8Array(8).fill(2));
  });

  it("makes entries stale whose dependencies were evicted", () => {
    const cache = create(16, 16);
    cache.set("dependency", new Uint8Array(8).fill(1));
    cache.set("dependent", new Uint8Array(0), { dependencies: [dependency(cache)] });
    cache.get("dependent");
    cache.set("other", new Uint8Array(8));
    cache.set("another", new Uint8Array(8));
    expect(cache.has("dependency")).toBe(false);
    expect(cache.has("dependent")).toBe(false);
  });

  it("evicts entries when the metadata buffer is at its maximum", () => {
    const cache = SharedCache.create({ initialDataCapacity: 32, initialMetadataCapacity: 512, maxDataCapacity: 1 << 20, maxMetadataCapacity: 4096 });
    for(let index = 0; index < 1000; index++){
      cache.set(`key:${index}`, encode(`${index}`));
    }
    expect(decode(cache.get("key:999"))).toBe("999");
    expect(cache.has("key:0")).toBe(false);
    expect(cache.getStats().metadataCapacity).toBe(4096);
    expect(cache.getStats().entries).toBeLessThan(1000);
  });
});

it("grows from the reclaimed tail rather than abandoning the final free extent", () => {
  const cache = create(16, 24);
  cache.set("old", new Uint8Array(16));
  cache.delete("old");
  cache.set("new", new Uint8Array(24).fill(9));
  expect(cache.get("new")).toEqual(new Uint8Array(24).fill(9));
  expect(cache.getStats().freeBytes).toBe(0);
});

it("reuses coalesced metadata across repeated replacements", () => {
  const cache = SharedCache.create({ initialDataCapacity: 32, initialMetadataCapacity: 1024, maxDataCapacity: 32, maxMetadataCapacity: 1024 });
  const version = cache.recordPathUpdate("/dependency", 0);
  for(let index = 0; index < 1000; index++){
    cache.set("key", new Uint8Array(8).fill(index % 256), { dependencies: [{ path: "/dependency", version }], path: "/file" });
    expect(cache.get("key")).toEqual(new Uint8Array(8).fill(index % 256));
  }
  expect(cache.getStats().metadataCapacity).toBe(1024);
  expect(cache.getStats().usedBytes + cache.getStats().freeBytes).toBe(32);
});

describe("sharedCache streams", () => {
  it("keeps snapshots safe and cancels pending publication when cleared", async () => {
    const cache = create(32, 32);
    cache.set("old", new Uint8Array(16).fill(7));
    const reader = cache.createReadStream("old");
    const writer = cache.createWriteStream("pending", 16);
    writer.write(new Uint8Array(8));
    cache.clear();
    cache.clear();
    expect(cache.has("old")).toBe(false);
    expect(cache.getStats().pinnedEntries).toBe(1);
    const completion = finished(writer);
    writer.end(new Uint8Array(8));
    await expect(completion).rejects.toThrow(/stale/);
    expect(cache.has("pending")).toBe(false);
    await pipeline(reader, new Writable({
      write(chunk: Buffer, _encoding, callback) {
        expect(chunk.every(byte => byte === 7)).toBe(true);
        callback();
      }
    }));
    cache.set("new", new Uint8Array(32));
    expect(cache.getStats().usedBytes).toBe(32);
  });

  it("keeps a pending writer stale even after a newer dependent write succeeds", async () => {
    const cache = create();
    cache.set("dependency", encode("1"));
    const writer = cache.createWriteStream("pending", 3, { dependencies: [dependency(cache)] });
    cache.set("dependency", encode("2"));
    cache.set("new", encode("new"), { dependencies: [dependency(cache)] });
    const completion = finished(writer);
    writer.end("old");
    await expect(completion).rejects.toThrow(/stale/);
    expect(cache.has("pending")).toBe(false);
    expect(decode(cache.get("new"))).toBe("new");
    expect(cache.getStats().writingEntries).toBe(0);
  });

  it("rejects a reservation invalidated during writing without replacing valid data", async () => {
    const cache = create();
    cache.set("key", encode("old"));
    const writer = cache.createWriteStream("key", 3, { path: "/changing" });
    writer.write("ne");
    cache.invalidatePath("/changing");
    const completion = finished(writer);
    writer.end("w");
    await expect(completion).rejects.toThrow(/stale/);
    expect(decode(cache.get("key"))).toBe("old");
    cache.set("changing", encode("1"));
    const dependent = cache.createWriteStream("key", 3, { dependencies: [dependency(cache, "changing")] });
    cache.set("changing", encode("2"));
    const dependentCompletion = finished(dependent);
    dependent.end("new");
    await expect(dependentCompletion).rejects.toThrow(/stale/);
    expect(decode(cache.get("key"))).toBe("old");
    expect(cache.getStats().writingEntries).toBe(0);
  });
  it("publishes only complete writes and preserves old entries on failure", async () => {
    const cache = create();
    cache.set("key", encode("old"));
    const writer = cache.createWriteStream("key", 3);
    writer.write("ne");
    expect(decode(cache.get("key"))).toBe("old");
    const completion = finished(writer);
    writer.end("w");
    await completion;
    expect(decode(cache.get("key"))).toBe("new");
    await expect(pipeline(Readable.from(["oversized"]), cache.createWriteStream("key", 2))).rejects.toThrow(/exceeded/);
    await expect(pipeline(Readable.from(["x"]), cache.createWriteStream("key", 2))).rejects.toThrow(/before/);
    expect(decode(cache.get("key"))).toBe("new");
    expect(cache.getStats().writingEntries).toBe(0);
  });

  it("pins retired payloads until readable cancellation", async () => {
    const cache = create(16, 16);
    cache.set("key", new Uint8Array(16).fill(8));
    const reader = cache.createReadStream("key");
    const completion = finished(reader);
    cache.delete("key");
    expect(cache.getStats().pinnedEntries).toBe(1);
    expect(() => cache.set("other", new Uint8Array(16))).toThrow(/capacity/);
    reader.destroy();
    await expect(completion).rejects.toThrow(/close/);
    cache.set("other", new Uint8Array(16).fill(9));
    expect(cache.getStats().pinnedEntries).toBe(0);
  });

  it("keeps a deleted payload until both overlapping read streams close", async () => {
    const cache = create(16, 16);
    cache.set("key", new Uint8Array(16).fill(7));
    const first = cache.createReadStream("key");
    const second = cache.createReadStream("key");
    const firstCompletion = finished(first);
    cache.delete("key");
    first.destroy();
    await expect(firstCompletion).rejects.toThrow(/close/);
    expect(() => cache.set("other", new Uint8Array(16))).toThrow(/capacity/);
    await pipeline(second, new Writable({
      write(chunk: Buffer, _encoding, callback) {
        expect(chunk.every(byte => byte === 7)).toBe(true);
        callback();
      }
    }));
    cache.set("other", new Uint8Array(16));
    expect(cache.getStats().pinnedEntries).toBe(0);
  });

  it("handles empty streams, write cancellation, and completion-order replacements", async () => {
    const cache = create();
    await pipeline(Readable.from([]), cache.createWriteStream("empty", 0));
    expect(cache.get("empty")).toEqual(new Uint8Array());
    await pipeline(cache.createReadStream("empty"), new Writable({ write(_chunk, _encoding, callback) { callback(); } }));
    const canceled = cache.createWriteStream("key", 16);
    const cancellation = finished(canceled);
    canceled.destroy(new Error("canceled"));
    await expect(cancellation).rejects.toThrow("canceled");
    const first = cache.createWriteStream("key", 3);
    const second = cache.createWriteStream("key", 3);
    await pipeline(Readable.from(["two"]), second);
    await pipeline(Readable.from(["one"]), first);
    expect(decode(cache.get("key"))).toBe("one");
    expect(cache.getStats().writingEntries).toBe(0);
  });

  it("pipes large files with bounded chunks and backpressure, and supports setFile", async () => {
    const directory = new TestDirectory({ "input.bin": "" }, true);
    try {
      const source = directory.files["input.bin"].path;
      const target = `${directory.directory}/output.bin`;
      const chunk = Buffer.alloc(32 * 1024, 37);
      const chunks = 128;
      await pipeline(Readable.from((function *() {
        for(let index = 0; index < chunks; index++){
          yield chunk;
        }
      })()), createWriteStream(source));
      const cache = create(32, chunk.length * chunks * 3);
      await pipeline(createReadStream(source, { highWaterMark: chunk.length }), cache.createWriteStream("file", chunk.length * chunks));
      let total = 0;
      await pipeline(cache.createReadStream("file"), new Writable({
        highWaterMark: 1,
        write(data: Buffer, _encoding, callback) {
          expect(data.length).toBeLessThanOrEqual(64 * 1024);
          expect(data.every(byte => byte === 37)).toBe(true);
          total += data.length;
          setImmediate(callback);
        }
      }));
      expect(total).toBe(chunk.length * chunks);
      await pipeline(cache.createReadStream("file"), createWriteStream(target));
      cache.setFile("copy", target);
      expect(cache.getStats().usedBytes).toBe(total * 2);
      expect(cache.getStats().pinnedEntries).toBe(0);
      writeFileSync(source, "small");
      cache.setFile("small", source);
      expect(decode(cache.get("small"))).toBe("small");
    } finally {
      directory.cleanUp();
    }
  });

  it("releases reservations and leases on upstream and downstream errors", async () => {
    const cache = create(32, 32);
    const source = new Readable({ read() { this.destroy(new Error("source failed")); } });
    await expect(pipeline(source, cache.createWriteStream("failed", 16))).rejects.toThrow("source failed");
    expect(cache.getStats().writingEntries).toBe(0);
    cache.set("key", new Uint8Array(16));
    await expect(pipeline(cache.createReadStream("key"), new Writable({
      write(_chunk, _encoding, callback) { callback(new Error("destination failed")); }
    }))).rejects.toThrow("destination failed");
    expect(cache.getStats().pinnedEntries).toBe(0);
    expect(() => cache.createReadStream("absent")).toThrow(/missing/);
  });
});

describe("sharedCache worker handoff", () => {
  it("supports sequential access from one worker without overlapping allocations", async () => {
    const cache = create(32, 1 << 20);
    cache.set("worker-dependency", encode("1"));
    cache.set("dependent", encode("old"), { dependencies: [dependency(cache, "worker-dependency")] });
    cache.recordPathUpdate("/worker-path", 1);
    cache.set("path", encode("old"), { path: "/worker-path" });
    const source = readFileSync(new URL("../../src/async-utils/shared-cache.ts", import.meta.url), "utf8");
    const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
    const workerSource = `${compiled}
      import { parentPort, workerData } from 'node:worker_threads';
      const cache = SharedCache.attach(workerData.metadata, workerData.data);
        for (let index = 0; index < 150; index++) {
          const length = 17 + index % 83;
          const key = 'worker:' + index;
          cache.set(key, new Uint8Array(length).fill(1));
          if (index % 3 === 0) {
            cache.delete(key);
            cache.set(key, new Uint8Array(length).fill(1));
          }
        }
        cache.set('worker-dependency', new Uint8Array([2]));
        cache.recordPathUpdate('/worker-path', 2);`;
    const worker = new Worker(new URL(`data:text/javascript,${encodeURIComponent(workerSource)}`), {
      execArgv: [],
      workerData: { data: cache.data, metadata: cache.metadata }
    });
    try {
      await new Promise<void>((resolve, reject) => {
        worker.on("error", reject);
        worker.on("exit", code => code === 0 ? resolve() : reject(new Error(`Worker exited: ${code}`)));
      });
      for(let index = 0; index < 150; index++){
        expect(cache.get(`worker:${index}`)).toEqual(new Uint8Array(17 + index % 83).fill(1));
      }
      expect(cache.has("dependent")).toBe(false);
      expect(cache.has("path")).toBe(false);
      const metadata = new DataView(cache.metadata);
      const ranges: { end: number; start: number; }[] = [];
      for(let entry = metadata.getUint32(28, true); entry; entry = metadata.getUint32(entry, true)){
        const start = metadata.getUint32(entry + 8, true);
        ranges.push({ end: start + metadata.getUint32(entry + 16, true), start });
      }
      ranges.sort((left, right) => left.start - right.start);
      for(let index = 1; index < ranges.length; index++){
        expect(ranges[index].start).toBeGreaterThanOrEqual(ranges[index - 1].end);
      }
      expect(cache.getStats().pinnedEntries).toBe(0);
      expect(cache.getStats().writingEntries).toBe(0);
    } finally {
      await worker.terminate();
    }
  });
});
