import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
  unlinkSync,
  utimesSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative } from "node:path";

import enhancedResolve from "enhanced-resolve";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CachedStore, CacheTag } from "../../src/async-utils/cached-store.js";
import { resolveCss } from "../../src/async-utils/resolvers.js";
import { SharedCache } from "../../src/async-utils/shared-cache.js";
import { TestDirectory } from "../utils/tmp.js";

import type { AsyncContext } from "../../src/utils/context.js";


const createCache = (maximum = 1 << 20): SharedCache => SharedCache.create({
  initialDataCapacity: Math.min(256, maximum),
  initialMetadataCapacity: 256,
  maxDataCapacity: maximum,
  maxMetadataCapacity: 1 << 20
});
const directories: TestDirectory<{ "file.bin": string; }>[] = [];

function hashKey(key: string): string {
  return createHash("sha256").update(key)
    .digest("hex")
    .slice(0, 32);
}

function createStore(cache = createCache()): typeof CachedStore {
  CachedStore.attachSharedState({ data: cache.data, metadata: cache.metadata });
  return CachedStore;
}

function fixture(): string {
  const directory = new TestDirectory({ "file.bin": "first" }, true);
  directories.push(directory);
  return directory.files["file.bin"].path;
}

function changeFile(path: string, content: string, timestamp = statSync(path).mtimeMs + 5000): void {
  writeFileSync(path, content);
  utimesSync(path, timestamp / 1000, timestamp / 1000);
}

afterEach(() => {
  vi.restoreAllMocks();
  for(const directory of directories.splice(0).reverse()){
    directory.cleanUp();
  }
});

describe("module-level resolver caching", () => {
  it("reuses unserializable objects while their dummy entry is valid", () => {
    const path = fixture();
    const directory = dirname(path);
    CachedStore.clear();
    const create = vi.spyOn(enhancedResolve.ResolverFactory, "createResolver");
    expect(resolveCss(path, directory)).toBe(realpathSync(path));
    expect(resolveCss(path, directory)).toBe(realpathSync(path));
    expect(create).toHaveBeenCalledTimes(1);
    CachedStore.invalidateTag(CacheTag.TS_CONFIG);
    resolveCss(path, directory);
    expect(create).toHaveBeenCalledTimes(2);
    CachedStore.invalidateTag(CacheTag.CWD);
    resolveCss(path, directory);
    expect(create).toHaveBeenCalledTimes(3);
    CachedStore.clear();
    resolveCss(path, directory);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it("rebuilds local resolvers for changed dependencies and context switches", () => {
    const path = fixture();
    const firstConfig = fixture();
    const secondConfig = fixture();
    writeFileSync(firstConfig, JSON.stringify({ compilerOptions: {} }));
    writeFileSync(secondConfig, JSON.stringify({ compilerOptions: {} }));
    const context = (config: string): AsyncContext => ({
      cwd: dirname(config),
      installation: dirname(config),
      tailwindConfigPath: path,
      tsconfigPath: config,
      version: { major: 4, minor: 0, patch: 0 },
      warnings: []
    });
    CachedStore.clear();
    const create = vi.spyOn(enhancedResolve.ResolverFactory, "createResolver");
    resolveCss(context(firstConfig), path);
    resolveCss(context(firstConfig), path);
    expect(create).toHaveBeenCalledTimes(1);
    resolveCss(context(secondConfig), path);
    resolveCss(context(firstConfig), path);
    expect(create).toHaveBeenCalledTimes(3);
    changeFile(firstConfig, JSON.stringify({ compilerOptions: { baseUrl: "." } }));
    resolveCss(context(firstConfig), path);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it("resets local objects when switching stores but not for the same buffer attachment", () => {
    const path = fixture();
    const directory = dirname(path);
    const original = CachedStore.getSharedState();
    const replacementCache = createCache();
    const replacement = { data: replacementCache.data, metadata: replacementCache.metadata };
    CachedStore.clear();
    const create = vi.spyOn(enhancedResolve.ResolverFactory, "createResolver");
    try {
      resolveCss(path, directory);
      CachedStore.attachSharedState(original);
      resolveCss(path, directory);
      expect(create).toHaveBeenCalledTimes(1);
      CachedStore.attachSharedState(replacement);
      resolveCss(path, directory);
      CachedStore.attachSharedState(original);
      resolveCss(path, directory);
      expect(create).toHaveBeenCalledTimes(3);
    } finally {
      CachedStore.attachSharedState(original);
    }
  });

  it("does not publish a valid dummy entry if resolver construction fails", () => {
    const path = fixture();
    CachedStore.clear();
    const create = vi.spyOn(enhancedResolve.ResolverFactory, "createResolver").mockImplementationOnce(() => {
      throw new Error("construction failed");
    });
    resolveCss(path, dirname(path));
    expect(CachedStore.isValid("css-resolver", {
      paths: [process.cwd()],
      tags: [CacheTag.CWD, CacheTag.TS_CONFIG]
    })).toBe(false);
    expect(resolveCss(path, dirname(path))).toBe(realpathSync(path));
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe("cachedStore values", () => {
  it("checks memoized entry validity without creating or refreshing entries", () => {
    const store = createStore();
    const path = fixture();
    const options = { paths: [path], tags: ["tag"] };
    expect(store.isValid("local", options)).toBe(false);
    expect(store.getStats().entries).toBe(0);
    store.getOrCreate("local", () => true, options);
    expect(store.isValid("local", options)).toBe(true);
    store.invalidateTag("tag");
    expect(store.isValid("local", options)).toBe(false);
    store.getOrCreate("local", () => true, options);
    changeFile(path, "changed");
    expect(store.isValid("local", options)).toBe(false);
    store.getOrCreate("local", () => true, options);
    expect(store.isValid("local", options)).toBe(true);
    expect(store.isValid("local", { paths: [], tags: ["tag"] })).toBe(false);
    unlinkSync(path);
    expect(store.isValid("local", options)).toBe(false);
    store.clear();
    expect(store.isValid("local", options)).toBe(false);
  });

  it("memoizes computed values with compound keys and cached undefined results", () => {
    const store = createStore();
    const compute = vi.fn((): undefined => undefined);
    expect(store.getOrCreate<unknown>(["key", undefined, false], compute)).toBeUndefined();
    expect(store.getOrCreate<unknown>(["key", false], compute)).toBeUndefined();
    expect(compute).toHaveBeenCalledTimes(1);
    expect(store.getOrCreate('["key",false]', () => "different")).toBe("different");
  });

  it("memoizes async values and propagates rejected computations", async () => {
    const store = createStore();
    const compute = vi.fn(async () => 42);
    await expect(store.getOrCreate("key", compute)).resolves.toBe(42);
    await expect(store.getOrCreate("key", compute)).resolves.toBe(42);
    expect(compute).toHaveBeenCalledTimes(1);
    const fail = vi.fn(async () => { throw new Error("failed"); });
    await expect(store.getOrCreate("failed", fail)).rejects.toThrow("failed");
    await expect(store.getOrCreate("failed", fail)).rejects.toThrow("failed");
    expect(fail).toHaveBeenCalledTimes(2);
  });

  it("refreshes memoized values when any dependency changes or disappears", () => {
    const store = createStore();
    const first = fixture();
    const second = fixture();
    const compute = vi.fn(() => compute.mock.calls.length);
    const options = { paths: [first, second], tags: ["tag"] };
    store.getOrCreate("key", compute, options);
    store.getOrCreate("key", compute, options);
    expect(compute).toHaveBeenCalledTimes(1);
    changeFile(second, "changed");
    store.getOrCreate("key", compute, options);
    expect(compute).toHaveBeenCalledTimes(2);
    store.invalidateTag("tag");
    store.getOrCreate("key", compute, options);
    expect(compute).toHaveBeenCalledTimes(3);
    unlinkSync(first);
    store.getOrCreate("key", compute, options);
    expect(compute).toHaveBeenCalledTimes(4);
  });

  it("exposes static operations and preserves same-buffer attachment identity", () => {
    expect(CachedStore).not.toHaveProperty("shared");
    CachedStore.clear();
    CachedStore.upsert("singleton", "value");
    const state = CachedStore.getSharedState();
    CachedStore.attachSharedState(state);
    expect(CachedStore.getSharedState()).toBe(state);
    expect(CachedStore.get("singleton")).toBe("value");
    CachedStore.clear();
    expect(CachedStore.has("singleton")).toBe(false);
  });

  it("round-trips V8 values, including cycles, without sharing decoded objects", () => {
    const store = createStore();
    const value = { binary: new Uint8Array([1, 2]), date: new Date(123), map: new Map([["key", 42n]]), set: new Set([3]) };
    store.upsert("structured", value);
    expect(store.get("structured")).toEqual(value);
    const copy = store.get<typeof value>("structured")!;
    copy.binary.fill(9);
    copy.map.clear();
    expect(store.get("structured")).toEqual(value);
    const cycle: { self?: unknown; } = {};
    cycle.self = cycle;
    store.upsert("cycle", cycle);
    const decoded = store.get<typeof cycle>("cycle")!;
    expect(decoded.self).toBe(decoded);
    for(const primitive of [undefined, null, true, 42, "text", 42n]){
      store.upsert("primitive", primitive);
      expect(store.has("primitive")).toBe(true);
      expect(store.get("primitive")).toBe(primitive);
    }
    expect(store.get("missing")).toBeUndefined();
    expect(store.has("missing")).toBe(false);
  });

  it("preserves previous values on serialization and capacity failures", () => {
    const cache = createCache(32);
    const store = createStore(cache);
    store.upsert("key", "old");
    cache.invalidateTag("tag");
    expect(() => store.upsert("key", () => 1, { tags: ["tag"] })).toThrow();
    expect(cache.isTagValid("tag", `value:${hashKey("key")}`)).toBe(false);
    expect(store.get("key")).toBe("old");
    expect(() => store.upsert("key", "x".repeat(100))).toThrow(/capacity/);
    expect(store.get("key")).toBe("old");
  });

  it("refreshes invalidated tags for new values without reviving older dependents", () => {
    const store = createStore();
    store.upsert("old", "old", { tags: ["shared", "other"] });
    for(let index = 0; index < 3; index++){
      store.invalidateTag("shared");
      expect(store.get("old")).toBeUndefined();
      store.upsert("new", index, { tags: ["shared"] });
      expect(store.get("new")).toBe(index);
      expect(store.has("old")).toBe(false);
    }
    store.invalidateTag("other");
    expect(store.has("new")).toBe(true);
  });

  it("treats read tags as additional guards without changing stored dependencies", () => {
    const store = createStore();
    store.upsert("key", "value");
    expect(store.get("key", { tags: ["guard"] })).toBe("value");
    store.invalidateTag("guard");
    expect(store.get("key", { tags: ["guard"] })).toBeUndefined();
    expect(store.has("key", { tags: ["guard"] })).toBe(false);
    expect(store.get("key")).toBe("value");
    store.upsert("fresh", "new");
    expect(store.get("fresh", { tags: ["guard"] })).toBe("new");
    expect(store.get("key", { tags: ["guard"] })).toBeUndefined();
    expect(store.delete("key")).toBe(true);
    expect(store.delete("key")).toBe(false);
  });
});

describe("cachedStore files", () => {
  it.each([
    { bytes: Buffer.from("caf\u00e9 \u4e16\u754c \uD83D\uDE00", "utf8"), expected: "caf\u00e9 \u4e16\u754c \uD83D\uDE00", name: "multibyte text" },
    { bytes: Buffer.from([0xC3, 0x28]), expected: "\uFFFD(", name: "malformed UTF-8" },
    { bytes: Buffer.from([0xEF, 0xBB, 0xBF, 0x61]), expected: "a", name: "UTF-8 BOM" },
    { bytes: Buffer.alloc(0), expected: "", name: "empty files" }
  ])("decodes $name on both file loads and cache hits", ({ bytes, expected }) => {
    const cache = createCache();
    const store = createStore(cache);
    const path = fixture();
    writeFileSync(path, bytes);
    const load = vi.spyOn(SharedCache.prototype, "setFile");
    expect(store.readFile(path)).toBe(expected);
    expect(store.readFile(path)).toBe(expected);
    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.get(`file:${hashKey(path)}`)).toEqual(new Uint8Array(bytes));
  });

  it("loads on a miss, reuses unchanged files, and normalizes relative paths", () => {
    const cache = createCache();
    const load = vi.spyOn(SharedCache.prototype, "setFile");
    const store = createStore(cache);
    const path = fixture();
    expect(store.hasFile(path)).toBe(false);
    expect(load).not.toHaveBeenCalled();
    expect(store.readFile(path)).toBe("first");
    expect(store.readFile(relative(process.cwd(), path))).toBe("first");
    expect(store.readFile(path)).toBe("first");
    expect(load).toHaveBeenCalledTimes(1);
    expect(store.hasFile(path)).toBe(true);
  });

  it("refreshes newer and backdated files without writing to disk", () => {
    const store = createStore();
    const path = fixture();
    store.readFile(path);
    changeFile(path, "newer");
    expect(store.hasFile(path)).toBe(false);
    expect(store.readFile(path)).toBe("newer");
    changeFile(path, "backdated", 1000);
    expect(store.readFile(path)).toBe("backdated");
    expect(store.deleteFile(path)).toBe(true);
    expect(store.deleteFile(path)).toBe(false);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toBe("backdated");
  });

  it("keeps file and value keys separate and supports shared reusable tags", () => {
    const store = createStore();
    const path = fixture();
    store.upsert(path, "value", { tags: ["shared"] });
    expect(store.readFile(path, { tags: ["shared"] })).toBe("first");
    store.invalidateTag("shared");
    expect(store.hasFile(path)).toBe(false);
    expect(store.get(path)).toBeUndefined();
    expect(store.readFile(path, { tags: ["shared"] })).toBe("first");
    expect(store.get(path)).toBeUndefined();
    store.upsert(path, "fresh", { tags: ["shared"] });
    expect(store.get(path)).toBe("fresh");
    expect(store.hasFile(path)).toBe(true);
  });

  it("checks optional file tags without populating on existence checks", () => {
    const store = createStore();
    const path = fixture();
    store.readFile(path);
    store.invalidateTag("guard");
    expect(store.hasFile(path, { tags: ["guard"] })).toBe(false);
    expect(store.hasFile(path)).toBe(true);
    expect(store.readFile(path, { tags: ["guard"] })).toBe("first");
    store.invalidateTag("guard");
    expect(store.hasFile(path)).toBe(false);
  });

  it("never serves deleted files and propagates non-missing filesystem errors", () => {
    const store = createStore();
    const path = fixture();
    store.readFile(path);
    unlinkSync(path);
    expect(() => store.readFile(path)).toThrow();
    expect(store.hasFile(path)).toBe(false);
    expect(store.deleteFile(path)).toBe(false);
    writeFileSync(path, "recreated");
    expect(store.readFile(path)).toBe("recreated");
    expect(store.hasFile(join(path, "child"))).toBe(false);
    expect(() => store.hasFile("bad\0path")).toThrow();
    expect(() => store.readFile("bad\0path")).toThrow();
  });

  it("retries a file changed during ingestion and rejects repeated changes", () => {
    const cache = createCache();
    const store = createStore(cache);
    const path = fixture();
    const original = cache.setFile.bind(cache);
    const load = vi.spyOn(SharedCache.prototype, "setFile").mockImplementationOnce((key, filePath, options) => {
      original(key, filePath, options);
      changeFile(path, "changed");
    });
    expect(store.readFile(path)).toBe("changed");
    expect(load).toHaveBeenCalledTimes(2);
    store.deleteFile(path);
    load.mockImplementation((key, filePath, options) => {
      original(key, filePath, options);
      changeFile(path, "changing");
    });
    expect(() => store.readFile(path)).toThrow(/repeatedly/);
    expect(store.hasFile(path)).toBe(false);
  });

  it("propagates capacity errors rather than bypassing cache limits", () => {
    const store = createStore(createCache(2));
    expect(() => store.readFile(fixture())).toThrow(/capacity/);
  });
});

it("clears values and files in place across wrapper attachments", () => {
  const cache = createCache();
  const attached = SharedCache.attach(cache.metadata, cache.data);
  const store = createStore(cache);
  const path = fixture();
  store.upsert("key", { value: 42 });
  store.readFile(path);
  const before = store.getStats();
  attached.clear();
  expect(store.has("key")).toBe(false);
  expect(store.hasFile(path)).toBe(false);
  expect(store.getStats().usedBytes).toBe(0);
  expect(store.getStats().dataCapacity).toBe(before.dataCapacity);
  expect(store.getStats().metadataCapacity).toBe(before.metadataCapacity);
  store.upsert("key", "new");
  expect(attached.has(`value:${hashKey("key")}`)).toBe(true);
  expect(store.get("key")).toBe("new");
  expect(existsSync(path)).toBe(true);
});
