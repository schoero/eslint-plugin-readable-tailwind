import { hash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import type { Stats } from "node:fs";
import { totalmem } from "node:os";
import { resolve } from "node:path";
import { DefaultDeserializer, DefaultSerializer } from "node:v8";

import { MAX_BUFFER_CAPACITY, SharedCache, SharedCacheCapacityError } from "./shared-cache.js";

import type { CacheDependency, CacheStats } from "./shared-cache.js";


export type CacheKey = readonly (boolean | number | string | undefined)[] | boolean | number | string;

// shared entries that other entries depend on
export enum CacheEntry {
  CWD = "cwd",
  TAILWIND_CONFIG_OPTION = "tailwind-config-option",
  TAILWIND_CONFIG_PATH = "tailwind-config-path",
  TAILWIND_CONTEXT = "tailwind-context",
  TAILWIND_PACKAGE_JSON_PATH = "tailwind-package-json-path",
  TAILWIND_VERSION = "tailwind-version",
  TSCONFIG_OPTION = "tsconfig-option",
  TSCONFIG_PATH = "tsconfig-path"
}

export interface CacheOptions {
  // entries the value is derived from, it becomes stale when any of them changes
  dependencies?: readonly CacheKey[];
  // files the value is derived from, it becomes stale when any of them changes
  paths?: readonly string[];
}

interface CachedValue<Value> {
  asynchronous: boolean;
  value: Value;
}

export interface CachedStoreState {
  data: SharedArrayBuffer;
  metadata: SharedArrayBuffer;
}

// modification time recorded for files that do not exist
const MISSING = -1;

// default maximum memory of the cache, a quarter is used for metadata and the rest for payloads
const DEFAULT_CAPACITY = 32 * 1024 * 1024;

// the settings are not validated by eslint, so the configured capacity is clamped
const MIN_CAPACITY = 1024 * 1024;
// the data buffer receives three quarters of the capacity and can not grow beyond the size a buffer can address
const MAX_CAPACITY = Math.floor(MAX_BUFFER_CAPACITY / 3 * 4);

// longer keys, for example large class lists, are hashed to keep their metadata and comparisons small
const MAX_KEY_LENGTH = 64;

// a flag in front of the value is cheaper than serializing a wrapper object
function encode(value: unknown, asynchronous: boolean): Buffer {
  const serializer = new DefaultSerializer();
  serializer.writeHeader();
  serializer.writeUint32(asynchronous ? 1 : 0);
  serializer.writeValue(value);
  return serializer.releaseBuffer();
}

function decode<Value>(bytes: Uint8Array): CachedValue<Value> {
  const deserializer = new DefaultDeserializer(bytes);
  deserializer.readHeader();
  const asynchronous = deserializer.readUint32() === 1;
  return { asynchronous, value: deserializer.readValue() as Value };
}

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== "object" && typeof value !== "function";
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR");
}

// the buffers grow to their maximum before evicting and never shrink, so they may use at most a quarter of the memory
// of the system, or of the container when it limits the process further, a constrained memory of 0 means no limit
function getMemoryLimit(): number {
  const constrained = process.constrainedMemory();
  const total = totalmem();
  return Math.floor((constrained > 0 ? Math.min(constrained, total) : total) / 4);
}

export class CachedStore {
  private static _cache: SharedCache | undefined;
  private static owned: SharedArrayBuffer | undefined;
  private static state: CachedStoreState | undefined;
  private static capacity: number | undefined;
  private static memoryLimit: number | undefined;
  private static readonly writtenInputs = new Map<string, { value: unknown; version: number | undefined; }>();
  private static readonly textDecoder = new TextDecoder("utf-8");

  private constructor() {}

  private static get cache(): SharedCache {
    if(this._cache?.resetRequested && this.isOwner()){
      this.reset();
    }
    if(!this._cache){
      this._cache = this.createCache(this.capacity ?? DEFAULT_CAPACITY);
      this.owned = this._cache.metadata;
    }
    return this._cache;
  }

  // the maximum memory of the buffers this thread creates, the first configured capacity applies and later ones
  // only when they are larger, so that different settings in one process do not replace the buffers over and over
  static setCapacity(bytes: number): void {
    if(!Number.isFinite(bytes)){
      return;
    }
    this.memoryLimit ??= getMemoryLimit();
    const capacity = Math.max(MIN_CAPACITY, Math.min(Math.floor(bytes), MAX_CAPACITY, this.memoryLimit));
    if(this.capacity !== undefined && capacity <= this.capacity){
      return;
    }
    // buffers can not change the maximum they were created with
    if(capacity !== (this.capacity ?? DEFAULT_CAPACITY) && this.isOwner()){
      this.reset();
    }
    this.capacity = capacity;
  }

  static attachSharedState(state: CachedStoreState): void {
    if(this._cache?.metadata === state.metadata && this._cache.data === state.data){
      return;
    }
    this._cache = SharedCache.attach(state.metadata, state.data);
    this.state = undefined;
  }

  static getSharedState(): CachedStoreState {
    return this.state ??= { data: this.cache.data, metadata: this.cache.metadata };
  }

  static get<Value = unknown>(key: CacheKey): Value | undefined {
    return this.read<Value>(this.valueKey(key))?.value;
  }

  static has(key: CacheKey): boolean {
    return this.withCapacity(() => this.cache.has(this.valueKey(key), this.modified), false);
  }

  static upsert<Value>(key: CacheKey, value: Value, options: CacheOptions = {}): void {
    const cacheKey = this.valueKey(key);

    // inputs are written on every call, a primitive this thread wrote before is not serialized again while its entry is unchanged
    const remember = options.dependencies === undefined && options.paths === undefined && isPrimitive(value);
    if(remember){
      const previous = this.writtenInputs.get(cacheKey);
      if(previous?.version !== undefined && Object.is(previous.value, value) && this.cache.version(cacheKey) === previous.version){
        return;
      }
    }

    this.write(cacheKey, value, false, this.snapshot(options));

    if(remember){
      this.writtenInputs.set(cacheKey, { value, version: this.cache.version(cacheKey) });
    }
  }

  static getOrCreate<Value>(key: CacheKey, create: () => Promise<Value>, options?: CacheOptions): Promise<Value>;
  static getOrCreate<Value>(key: CacheKey, create: () => Value, options?: CacheOptions): Value;
  static getOrCreate<Value>(key: CacheKey, create: () => Promise<Value> | Value, options: CacheOptions = {}): Promise<Value> | Value {
    const cacheKey = this.valueKey(key);
    const cached = this.read<Value>(cacheKey);
    if(cached !== undefined){
      return cached.asynchronous ? Promise.resolve(cached.value) : cached.value;
    }
    // taken before creating the value, so that changes during its creation make it stale
    const dependencies = this.snapshot(options);
    const save = (value: Value, asynchronous: boolean): Value => {
      // the other side of the worker boundary may have written the entry in the meantime
      if(!this.cache.has(cacheKey)){
        this.write(cacheKey, value, asynchronous, dependencies);
      }
      return value;
    };
    const value = create();

    return value instanceof Promise
      ? value.then(result => save(result, true))
      : save(value, false);
  }

  // like getOrCreate() for many keys at once, `create` is called once with the indexes of the missing keys
  // and returns their values in the same order, every value is stored as its own entry
  static getOrCreateEach<Value>(keys: readonly CacheKey[], create: (missing: number[]) => Value[], options: CacheOptions = {}): Value[] {
    const cacheKeys = keys.map(key => this.valueKey(key));
    const values = new Array<Value>(keys.length);
    const first = new Map<string, number>();
    const missing: number[] = [];

    for(let index = 0; index < cacheKeys.length; index++){
      if(first.has(cacheKeys[index])){
        continue;
      }
      first.set(cacheKeys[index], index);
      const cached = this.read<Value>(cacheKeys[index]);
      if(cached === undefined){
        missing.push(index);
      } else {
        values[index] = cached.value;
      }
    }

    if(missing.length > 0){
      // taken before creating the values, so that changes during their creation make them stale
      const dependencies = this.snapshot(options);
      const created = create(missing);
      for(let position = 0; position < missing.length; position++){
        const index = missing[position];
        values[index] = created[position];
        // the other side of the worker boundary may have written the entry in the meantime
        if(!this.cache.has(cacheKeys[index])){
          this.write(cacheKeys[index], created[position], false, dependencies);
        }
      }
    }

    for(let index = 0; index < cacheKeys.length; index++){
      values[index] = values[first.get(cacheKeys[index])!];
    }

    return values;
  }

  // records the current modification times of the files an entry depends on
  // entries that depend on it transitively only compare the recorded times and never access the file system
  static refreshPaths(key: CacheKey): void {
    this.withCapacity(() => this.cache.has(this.valueKey(key), this.modified), false);
  }

  static delete(key: CacheKey): boolean {
    return this.cache.delete(this.valueKey(key));
  }

  static readFile(filePath: string): string {
    try {
      return this.readCachedFile(filePath);
    } catch (error){
      if(!(error instanceof SharedCacheCapacityError)){
        throw error;
      }
      this.handleExhaustion();
      return this.textDecoder.decode(readFileSync(resolve(filePath)));
    }
  }

  private static readCachedFile(filePath: string): string {
    const path = resolve(filePath);
    const key = `file:${path}`;
    let before = this.fileStats(path);
    this.cache.recordPathUpdate(path, before.mtimeMs);
    const cached = this.cache.get(key);
    if(cached !== undefined){
      return this.textDecoder.decode(cached);
    }

    for(let attempt = 0; attempt < 2; attempt++){
      let loaded = false;
      let failure: unknown;
      try {
        this.cache.setFile(key, path, { path });
        loaded = true;
      } catch (error){
        failure = error;
      }
      const after = this.fileStats(path);
      this.cache.recordPathUpdate(path, after.mtimeMs);
      if(before.mtimeMs === after.mtimeMs && before.size === after.size){
        if(!loaded){
          throw failure;
        }
        const data = this.cache.get(key);
        if(data === undefined){
          throw new Error("File cache entry became stale during loading");
        }
        return this.textDecoder.decode(data);
      }
      this.cache.delete(key);
      before = after;
    }
    throw new Error(`File changed repeatedly while being cached: ${path}`);
  }

  static hasFile(filePath: string): boolean {
    const path = resolve(filePath);
    try {
      this.cache.recordPathUpdate(path, this.fileStats(path).mtimeMs);
    } catch (error){
      if(isMissingFile(error)){
        return false;
      }
      if(error instanceof SharedCacheCapacityError){
        this.handleExhaustion();
        return false;
      }
      throw error;
    }
    return this.cache.has(`file:${path}`);
  }

  static deleteFile(filePath: string): boolean {
    return this.cache.delete(`file:${resolve(filePath)}`);
  }

  static clear(): void {
    this.cache.clear();
  }

  static getStats(): CacheStats {
    return this.cache.getStats();
  }

  private static valueKey(key: CacheKey): string {
    const normalized = Array.isArray(key) ? key.filter(part => part !== undefined) : key;
    const json = JSON.stringify(normalized);
    // the shared cache hashes and compares keys itself, so short keys are used as they are
    // hashed keys start with a character that json never starts with, so they can not collide with short keys
    return json.length <= MAX_KEY_LENGTH
      ? `value:${json}`
      : `value:#${hash("sha256", json, "hex").slice(0, 32)}`;
  }

  private static read<Value>(cacheKey: string): CachedValue<Value> | undefined {
    const bytes = this.withCapacity(() => this.cache.get(cacheKey, this.modified), undefined);
    return bytes === undefined ? undefined : decode<Value>(bytes);
  }

  // refreshing paths may have to create path entries again, which allocates
  private static withCapacity<Result>(operation: () => Result, fallback: Result): Result {
    try {
      return operation();
    } catch (error){
      if(!(error instanceof SharedCacheCapacityError)){
        throw error;
      }
      this.handleExhaustion();
      return fallback;
    }
  }

  private static write<Value>(cacheKey: string, value: Value, asynchronous: boolean, dependencies: (CacheDependency | undefined)[]): void {
    // an entry with a missing or changed dependency would be stale right away
    if(!dependencies.every(dependency => dependency !== undefined && this.isCurrent(dependency))){
      return;
    }
    const data = encode(value, asynchronous);
    try {
      this.cache.set(cacheKey, data, { dependencies: dependencies as CacheDependency[] });
    } catch (error){
      if(!(error instanceof SharedCacheCapacityError)){
        throw error;
      }
      this.handleExhaustion();
    }
  }

  // the shared cache evicts the least recently used entries, it is only exhausted by allocations that can never fit
  // or when everything is pinned, instead of failing the lint run the cache starts over: the owner replaces the buffers,
  // attached threads skip caching and ask the owner to replace them on its next access
  private static handleExhaustion(): void {
    if(this.isOwner()){
      this.reset();
    } else {
      this._cache?.requestReset();
    }
  }

  private static isOwner(): boolean {
    return !!this._cache && this._cache.metadata === this.owned;
  }

  // attached threads receive the new buffers with their next call and reset their local objects
  private static reset(): void {
    this._cache = undefined;
    this.owned = undefined;
    this.state = undefined;
  }

  // the maximum of the buffers is reserved as address space when they are created, which fails on hosts with little
  // address space, for example 32-bit systems or limited virtual memory, smaller buffers are created instead
  private static createCache(capacity: number): SharedCache {
    const maxMetadataCapacity = Math.floor(capacity / 4);
    const maxDataCapacity = capacity - maxMetadataCapacity;
    try {
      return SharedCache.create({
        // 1MB
        initialDataCapacity: Math.min(1024 * 1024, maxDataCapacity),
        // 64KB
        initialMetadataCapacity: Math.min(64 * 1024, maxMetadataCapacity),
        maxDataCapacity,
        maxMetadataCapacity
      });
    } catch (error){
      if(!(error instanceof RangeError) || capacity <= MIN_CAPACITY){
        throw error;
      }
      return this.createCache(Math.max(Math.floor(capacity / 2), MIN_CAPACITY));
    }
  }

  private static snapshot({ dependencies = [], paths = [] }: CacheOptions): (CacheDependency | undefined)[] {
    return [
      ...dependencies.map(dependency => {
        const key = this.valueKey(dependency);
        const version = this.withCapacity(() => this.cache.version(key, this.modified), undefined);
        return version === undefined ? undefined : { key, version };
      }),
      ...paths.map(path => {
        const resolved = resolve(path);
        try {
          return { path: resolved, version: this.cache.recordPathUpdate(resolved, this.modified(resolved)) };
        } catch (error){
          if(!(error instanceof SharedCacheCapacityError)){
            throw error;
          }
          this.handleExhaustion();
        }
      })
    ];
  }

  private static isCurrent(dependency: CacheDependency): boolean {
    return "key" in dependency
      ? this.cache.version(dependency.key) === dependency.version
      : this.cache.pathVersion(dependency.path) === dependency.version;
  }

  private static readonly modified = (path: string): number => {
    try {
      return statSync(path).mtimeMs;
    } catch (error){
      if(isMissingFile(error)){
        return MISSING;
      }
      throw error;
    }
  };

  private static fileStats(path: string): Stats {
    try {
      return statSync(path);
    } catch (error){
      if(isMissingFile(error)){
        this.cache.delete(`file:${path}`);
      }
      throw error;
    }
  }
}
