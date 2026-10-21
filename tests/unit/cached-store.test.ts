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

import { CachedStore } from "../../src/async-utils/cached-store.js";
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

function valueKey(key: string): string {
  return `value:${JSON.stringify(key)}`;
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
    CachedStore.delete(["css-resolver"]);
    resolveCss(path, directory);
    expect(create).toHaveBeenCalledTimes(2);
    CachedStore.clear();
    resolveCss(path, directory);
    expect(create).toHaveBeenCalledTimes(3);
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
    expect(CachedStore.has(["css-resolver"])).toBe(false);
    expect(resolveCss(path, dirname(path))).toBe(realpathSync(path));
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe("cachedStore values", () => {
  it("checks entry validity against entry and file dependencies without creating entries", () => {
    const store = createStore();
    const path = fixture();
    const options = { dependencies: ["dependency"], paths: [path] };
    store.upsert("dependency", 1);
    expect(store.has("local")).toBe(false);
    expect(store.getStats().entries).toBe(1);
    store.getOrCreate("local", () => true, options);
    expect(store.has("local")).toBe(true);
    store.upsert("dependency", 2);
    expect(store.has("local")).toBe(false);
    store.getOrCreate("local", () => true, options);
    expect(store.has("local")).toBe(true);
    changeFile(path, "changed");
    expect(store.has("local")).toBe(false);
    store.getOrCreate("local", () => true, options);
    expect(store.has("local")).toBe(true);
    unlinkSync(path);
    expect(store.has("local")).toBe(false);
    store.clear();
    expect(store.has("local")).toBe(false);
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
    const options = { dependencies: ["dependency"], paths: [first, second] };
    store.upsert("dependency", 1);
    store.getOrCreate("key", compute, options);
    store.getOrCreate("key", compute, options);
    expect(compute).toHaveBeenCalledTimes(1);
    changeFile(second, "changed");
    store.getOrCreate("key", compute, options);
    expect(compute).toHaveBeenCalledTimes(2);
    store.upsert("dependency", 2);
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
    expect(() => store.upsert("key", () => 1)).toThrow();
    expect(store.get("key")).toBe("old");
    // attached threads skip caching and ask the owner to replace the buffers
    expect(() => store.upsert("key", "x".repeat(100))).not.toThrow();
    expect(cache.resetRequested).toBe(true);
    expect(store.get("key")).toBe("old");
  });

  it("creates buffers with the configured capacity and only replaces them for a larger one", () => {
    const original = CachedStore.getSharedState();
    const capacity = Reflect.get(CachedStore, "capacity");
    const create = vi.spyOn(SharedCache, "create");
    const megabytes = (value: number) => value * 1024 * 1024;
    try {
      Reflect.set(CachedStore, "_cache", undefined);
      Reflect.set(CachedStore, "state", undefined);
      Reflect.set(CachedStore, "capacity", undefined);
      CachedStore.setCapacity(megabytes(8));
      const first = CachedStore.getSharedState();
      expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ maxDataCapacity: megabytes(6), maxMetadataCapacity: megabytes(2) }));
      CachedStore.setCapacity(megabytes(4));
      CachedStore.setCapacity(megabytes(8));
      expect(CachedStore.getSharedState()).toBe(first);
      CachedStore.setCapacity(megabytes(16));
      expect(CachedStore.getSharedState()).not.toBe(first);
      expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ maxDataCapacity: megabytes(12), maxMetadataCapacity: megabytes(4) }));
      expect(create).toHaveBeenCalledTimes(2);
    } finally {
      Reflect.set(CachedStore, "capacity", capacity);
      CachedStore.attachSharedState(original);
    }
  });

  it("attaches shared buffers without creating buffers of its own", () => {
    const original = CachedStore.getSharedState();
    const cache = createCache();
    const create = vi.spyOn(SharedCache, "create");
    try {
      Reflect.set(CachedStore, "_cache", undefined);
      CachedStore.attachSharedState({ data: cache.data, metadata: cache.metadata });
      expect(create).not.toHaveBeenCalled();
      expect(CachedStore.getSharedState().metadata).toBe(cache.metadata);
    } finally {
      CachedStore.attachSharedState(original);
    }
  });

  it("evicts least recently used values instead of exhausting the buffers", () => {
    const cache = createCache(4096);
    const store = createStore(cache);
    store.upsert("dependency", "value");
    for(let index = 0; index < 1000; index++){
      store.upsert(`key:${index}`, index, { dependencies: ["dependency"] });
      store.get("dependency");
    }
    expect(cache.resetRequested).toBe(false);
    expect(store.get("key:999")).toBe(999);
    expect(store.get("key:0")).toBeUndefined();
    expect(store.get("dependency")).toBe("value");
    expect(cache.getStats().dataCapacity).toBe(4096);
  });

  it("replaces exhausted buffers it owns and buffers an attached thread asks to replace", () => {
    const original = CachedStore.getSharedState();
    const create = SharedCache.create.bind(SharedCache);
    vi.spyOn(SharedCache, "create").mockImplementation(options => create({ ...options, initialDataCapacity: 32, maxDataCapacity: 64 }));
    try {
      Reflect.set(CachedStore, "_cache", undefined);
      CachedStore.upsert("key", "value");
      const exhausted = CachedStore.getSharedState();
      expect(CachedStore.get("key")).toBe("value");
      expect(() => CachedStore.upsert("key", "x".repeat(100))).not.toThrow();
      expect(CachedStore.getSharedState()).not.toBe(exhausted);
      expect(CachedStore.get("key")).toBeUndefined();
      CachedStore.upsert("key", "value");
      const requested = CachedStore.getSharedState();
      SharedCache.attach(requested.metadata, requested.data).requestReset();
      expect(CachedStore.get("key")).toBeUndefined();
      expect(CachedStore.getSharedState()).not.toBe(requested);
    } finally {
      CachedStore.attachSharedState(original);
    }
  });

  it("invalidates transitive dependents only when a value changes", () => {
    const store = createStore();
    store.upsert("input", "a");
    store.upsert("derived", "derived", { dependencies: ["input"] });
    store.upsert("result", "result", { dependencies: ["derived"] });
    store.upsert("input", "a");
    expect(store.has("result")).toBe(true);
    store.upsert("input", "b");
    expect(store.has("derived")).toBe(false);
    expect(store.has("result")).toBe(false);
    // the same value written again keeps the entries that were derived from it valid
    store.upsert("derived", "derived", { dependencies: ["input"] });
    expect(store.has("result")).toBe(true);
    store.upsert("derived", "changed", { dependencies: ["input"] });
    expect(store.has("result")).toBe(false);
    store.delete("derived");
    expect(store.has("result")).toBe(false);
  });

  it("does not store values with missing or changing dependencies", () => {
    const store = createStore();
    store.upsert("result", "value", { dependencies: ["missing"] });
    expect(store.has("result")).toBe(false);
    const compute = vi.fn(() => "value");
    store.getOrCreate("computed", compute, { dependencies: ["missing"] });
    store.getOrCreate("computed", compute, { dependencies: ["missing"] });
    expect(compute).toHaveBeenCalledTimes(2);
    store.upsert("dependency", 1);
    store.getOrCreate("changing", () => {
      store.upsert("dependency", 2);
      return "value";
    }, { dependencies: ["dependency"] });
    expect(store.has("changing")).toBe(false);
    expect(store.delete("dependency")).toBe(true);
    expect(store.delete("dependency")).toBe(false);
  });

  it("creates only missing values of many keys and stores each of them", () => {
    const store = createStore();
    store.upsert("dependency", 1);
    const create = vi.fn((missing: number[]) => missing.map(index => `value:${index}`));
    const options = { dependencies: ["dependency"] };
    expect(store.getOrCreateEach(["a", "b", "a"], create, options)).toEqual(["value:0", "value:1", "value:0"]);
    expect(create).toHaveBeenLastCalledWith([0, 1]);
    expect(store.getOrCreateEach(["b", "c", "a"], create, options)).toEqual(["value:1", "value:1", "value:0"]);
    expect(create).toHaveBeenLastCalledWith([1]);
    expect(store.getOrCreateEach(["a", "b", "c"], create, options)).toEqual(["value:0", "value:1", "value:1"]);
    expect(create).toHaveBeenCalledTimes(2);
    store.upsert("dependency", 2);
    store.getOrCreateEach(["a"], create, options);
    expect(create).toHaveBeenLastCalledWith([0]);
    store.getOrCreateEach(["missing"], create, { dependencies: ["absent"] });
    expect(store.has("missing")).toBe(false);
  });

  it("hashes long keys and keeps short keys as they are", () => {
    const cache = createCache();
    const store = createStore(cache);
    const classes = Array.from({ length: 100 }, (_, index) => `class-${index}`);
    store.upsert(["classes", ...classes], "long");
    store.upsert(["classes", ...classes.slice(0, 2)], "short");
    expect(store.get(["classes", ...classes])).toBe("long");
    expect(store.get(["classes", ...classes.slice(0, 2)])).toBe("short");
    expect(store.get(["classes", ...classes.slice(1)])).toBeUndefined();
    const keys = cache.getStats().keys;
    expect(keys).toContain(`value:${JSON.stringify(["classes", "class-0", "class-1"])}`);
    expect(keys.find(key => key.startsWith("value:#"))).toHaveLength(39);
  });

  it("does not serialize unchanged primitives again unless the entry changed", () => {
    const cache = createCache();
    const store = createStore(cache);
    store.upsert("input", "value");
    const set = vi.spyOn(SharedCache.prototype, "set");
    store.upsert("input", "value");
    expect(set).not.toHaveBeenCalled();
    SharedCache.attach(cache.metadata, cache.data).set(valueKey("input"), new Uint8Array([1]));
    store.upsert("input", "value");
    expect(set).toHaveBeenCalledTimes(2);
    expect(store.get("input")).toBe("value");
    store.clear();
    store.upsert("input", "value");
    expect(store.get("input")).toBe("value");
    store.upsert("input", "changed");
    expect(store.get("input")).toBe("changed");
  });

  it("only writes entries when necessary", () => {
    const cache = createCache();
    const store = createStore(cache);
    const set = vi.spyOn(SharedCache.prototype, "set");
    // the other side of the worker boundary writes the entry while it is being created
    expect(store.getOrCreate("key", () => {
      store.upsert("key", "value");
      return "value";
    })).toBe("value");
    expect(set).toHaveBeenCalledTimes(1);
    const version = cache.version(valueKey("key"));
    store.upsert("key", "value");
    expect(cache.version(valueKey("key"))).toBe(version);
    expect(store.getStats().entries).toBe(1);
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
    expect(cache.get(`file:${path}`)).toEqual(new Uint8Array(bytes));
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

  it("keeps file and value keys separate", () => {
    const store = createStore();
    const path = fixture();
    store.upsert(path, "value");
    expect(store.readFile(path)).toBe("first");
    expect(store.get(path)).toBe("value");
    store.deleteFile(path);
    expect(store.hasFile(path)).toBe(false);
    expect(store.get(path)).toBe("value");
    store.delete(path);
    expect(store.hasFile(path)).toBe(false);
    expect(store.readFile(path)).toBe("first");
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

  it("reads files directly when the cache is exhausted", () => {
    const cache = createCache(2);
    const store = createStore(cache);
    const path = fixture();
    expect(store.readFile(path)).toBe("first");
    expect(store.hasFile(path)).toBe(false);
    expect(cache.resetRequested).toBe(true);
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
  expect(attached.has(valueKey("key"))).toBe(true);
  expect(store.get("key")).toBe("new");
  expect(existsSync(path)).toBe(true);
});
