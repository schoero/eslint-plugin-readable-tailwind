import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import type { Stats } from "node:fs";
import { resolve } from "node:path";
import { deserialize, serialize } from "node:v8";

import { SharedCache } from "./shared-cache.js";

import type { CacheReadOptions, CacheStats } from "./shared-cache.js";


export type CacheAccessOptions = CacheReadOptions;

export type CacheKey = readonly (boolean | number | string | undefined)[] | boolean | number | string;

export enum CacheTag {
  CONTEXT = "context",
  CWD = "cwd",
  TS_CONFIG = "tsconfig"
}

export interface CacheMemoOptions extends CacheAccessOptions {
  paths?: readonly string[];
}

interface FileDependency {
  modified: number | undefined;
  path: string;
}

interface MemoizedValue<Value> {
  asynchronous: boolean;
  dependencies: FileDependency[];
  value: Value;
}

export interface CachedStoreState {
  data: SharedArrayBuffer;
  metadata: SharedArrayBuffer;
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR");
}

export class CachedStore {
  private static _cache: SharedCache | undefined;
  private static state: CachedStoreState | undefined;
  private static readonly textDecoder = new TextDecoder("utf-8");

  private constructor() {}

  private static get cache(): SharedCache {
    return this._cache ??= SharedCache.create({
      // 1MB
      initialDataCapacity: 1024 * 1024,
      // 64KB
      initialMetadataCapacity: 64 * 1024,
      // 256MB
      maxDataCapacity: 256 * 1024 * 1024,
      // 16MB
      maxMetadataCapacity: 16 * 1024 * 1024
    });
  }

  static attachShared(state: CachedStoreState): void {
    if(this.cache?.metadata === state.metadata && this.cache.data === state.data){
      return;
    }
    this._cache = SharedCache.attach(state.metadata, state.data);
    this.state = undefined;
  }

  static toTransferableState(): CachedStoreState {
    return this.state ??= { data: this.cache.data, metadata: this.cache.metadata };
  }

  static get<Value = unknown>(key: string, options: CacheAccessOptions = {}): Value | undefined {
    const data = this.cache.get(`value:${this.hashKey(key)}`, options);
    return data === undefined ? undefined : deserialize(data) as Value;
  }

  static upsert<Value>(key: string, value: Value, options: CacheAccessOptions = {}): void {
    const data = serialize(value);
    this.cache.set(`value:${this.hashKey(key)}`, data, options);
  }

  static getOrCreate<Value>(key: CacheKey, create: () => Promise<Value>, options?: CacheMemoOptions): Promise<Value>;
  static getOrCreate<Value>(key: CacheKey, create: () => Value, options?: CacheMemoOptions): Value;
  static getOrCreate<Value>(key: CacheKey, create: () => Promise<Value> | Value, options: CacheMemoOptions = {}): Promise<Value> | Value {
    const cacheKey = this.memoKey(key);
    const dependencies = this.fileDependencies(options.paths ?? []);
    const cached = this.memoized<Value>(cacheKey, dependencies, options);
    if(cached !== undefined){
      return cached.asynchronous ? Promise.resolve(cached.value) : cached.value;
    }
    const save = (value: Value, asynchronous: boolean): Value => {
      this.cache.set(cacheKey, serialize({ asynchronous, dependencies, value } satisfies MemoizedValue<Value>), options);
      return value;
    };
    const value = create();

    return value instanceof Promise
      ? value.then(result => save(result, true))
      : save(value, false);
  }

  static isValid(key: CacheKey, options: CacheMemoOptions = {}): boolean {
    return this.memoized(this.memoKey(key), this.fileDependencies(options.paths ?? []), options) !== undefined;
  }

  static readFile(filePath: string, options: CacheAccessOptions = {}): string {
    const path = resolve(filePath);
    const key = `file:${this.hashKey(path)}`;
    let before = this.fileStats(path);
    this.cache.recordPathUpdate(path, before.mtimeMs);
    const cached = this.cache.get(key, options);
    if(cached !== undefined){
      return this.textDecoder.decode(cached);
    }

    for(let attempt = 0; attempt < 2; attempt++){
      let loaded = false;
      let failure: unknown;
      try {
        this.cache.setFile(key, path, { ...options, path });
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

  static has(key: string, options: CacheAccessOptions = {}): boolean {
    return this.cache.has(`value:${this.hashKey(key)}`, options);
  }

  static hasFile(filePath: string, options: CacheAccessOptions = {}): boolean {
    const path = resolve(filePath);
    try {
      this.cache.recordPathUpdate(path, this.fileStats(path).mtimeMs);
    } catch (error){
      if(isMissingFile(error)){
        return false;
      }
      throw error;
    }
    return this.cache.has(`file:${this.hashKey(path)}`, options);
  }

  static delete(key: string): boolean {
    return this.cache.delete(`value:${this.hashKey(key)}`);
  }

  static deleteFile(filePath: string): boolean {
    return this.cache.delete(`file:${this.hashKey(resolve(filePath))}`);
  }

  static invalidateTag(tag: string): void {
    this.cache.invalidateTag(tag);
  }

  static clear(): void {
    this.cache.clear();
  }

  static getStats(): CacheStats {
    return this.cache.getStats();
  }

  private static memoKey(key: CacheKey): string {
    const normalized = Array.isArray(key) ? key.filter(part => part !== undefined) : key;
    return `memo:${this.hashKey(JSON.stringify(normalized))}`;
  }

  private static fileDependencies(paths: readonly string[]): FileDependency[] {
    return paths.map(path => {
      const resolved = resolve(path);
      let modified: number | undefined;
      try {
        modified = statSync(resolved).mtimeMs;
      } catch (error){
        if(!isMissingFile(error)){
          throw error;
        }
      }
      return { modified, path: resolved };
    });
  }

  private static memoized<Value>(key: string, dependencies: FileDependency[], options: CacheMemoOptions): MemoizedValue<Value> | undefined {
    const bytes = this.cache.get(key, options);
    if(bytes === undefined){
      return;
    }
    const cached = deserialize(bytes) as MemoizedValue<Value>;
    if(cached.dependencies.length === dependencies.length && cached.dependencies.every((dependency, index) => dependency.modified !== undefined && dependency.modified === dependencies[index].modified && dependency.path === dependencies[index].path)){
      return cached;
    }
  }

  private static hashKey(key: string): string {
    return createHash("sha256").update(key)
      .digest("hex")
      .slice(0, 32);
  }

  private static fileStats(path: string): Stats {
    try {
      return statSync(path);
    } catch (error){
      if(isMissingFile(error)){
        this.cache.delete(`file:${this.hashKey(path)}`);
      }
      throw error;
    }
  }
}
