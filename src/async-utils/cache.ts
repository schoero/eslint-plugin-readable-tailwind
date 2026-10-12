import { hash } from "node:crypto";
import { readFileSync } from "node:fs";

import { ShareableMap } from "shared-memory-datastructures";

import { getModifiedDate } from "./fs.js";

import type { Serializable, TransferableState } from "shared-memory-datastructures";


type SharedCache = ShareableMap<string, Uint8Array>;
type IsolatedCache = Map<string, CacheEntry>;

type CacheKey = (boolean | number | string | undefined)[] | boolean | number | string;
type CacheKeyHash = string & { readonly __brand: "CacheKeyHash"; };

export type CacheSource = string[] | string | undefined;

interface CacheEntry<Value = unknown> {
  date: Date;
  path: string[] | undefined;
  tag: string[] | undefined;
  value: Value;
}

export interface CacheOptions<Value> {
  /**
   * Custom invalidator. If omitted, the cache uses `invalidateByModifiedDate`
   * when `path` is provided or `invalidateByTagChange` when `tag` is provided.
   */
  invalidate?: false | CacheInvalidator<Value> | undefined;
  /** File path or paths used for modification-time based invalidation. */
  path?: string[] | string | undefined;
  /** Arbitrary value or values used for equality-based invalidation (e.g. A `cwd`). */
  tag?: string[] | string | undefined;
}

interface CacheOption {
  cache?: IsolatedCache | SharedCache;
}

export type CacheInvalidator<Value> = (cached: CacheEntry<Value>, source: CacheSource) => boolean;

export class Cache {

  private static limit = 1024;

  private static _shared: SharedCache;
  private static _isolated: IsolatedCache;

  private static textEncoder = new TextEncoder();
  private static textDecoder = new TextDecoder("utf-8");

  private static bytesSerializer = {
    decode(buffer: Uint8Array): Uint8Array {
      return new Uint8Array(buffer);
    },
    encode(object: Uint8Array, destination: Uint8Array): number {
      destination.set(object);
      return object.byteLength;
    },
    maximumLength(object: Uint8Array): number {
      return object.byteLength;
    }
  } satisfies Serializable<Uint8Array>;


  private constructor() {}

  public static get SHARED_CACHE() {
    this._shared ??= new ShareableMap<string, Uint8Array>({
      averageBytesPerValue: 1024,
      expectedSize: 1024,
      serializer: this.bytesSerializer
    });
    return this._shared;
  }

  public static get ISOLATED_CACHE() {
    this._isolated ??= new Map<string, CacheEntry>();
    return this._isolated;
  }

  public static has(key: CacheKey): boolean {
    return this.SHARED_CACHE.has(this._getKey(key));
  }

  public static isValid<Value = unknown>(key: CacheKey, { cache = this.SHARED_CACHE, ...options }: CacheOption & CacheOptions<Value> = {}): boolean {
    const cached = this._getValue<Value>(cache, key);
    return cached !== undefined && this._isValid(cached, options);
  }

  public static delete(key: CacheKey): boolean {
    return this.SHARED_CACHE.delete(this._getKey(key));
  }

  public static clear(): void {
    this.SHARED_CACHE.clear();
    this.ISOLATED_CACHE.clear();
  }

  public static keys(): string[] {
    return Array.from(this.SHARED_CACHE.keys());
  }

  public static values(): Uint8Array[] {
    return Array.from(this.SHARED_CACHE.values());
  }

  public static entries(): [string, Uint8Array][] {
    return Array.from(this.SHARED_CACHE.entries());
  }

  public static toTransferableState() {
    return this.SHARED_CACHE.toTransferableState();
  }

  public static fromTransferableState(state: TransferableState) {
    this._shared ??= ShareableMap.fromTransferableState<string, Uint8Array>(state, {
      serializer: this.bytesSerializer
    });
    this._isolated ??= new Map<string, CacheEntry>();
  }

  public static readFile(path: string, options: CacheOptions<Uint8Array> = {}): string {
    const cached = this._getValue<Uint8Array>(this.SHARED_CACHE, path);
    const normalizedPath = this._normalizeSource(path);
    const normalizedTag = this._normalizeSource(options.tag);

    if(cached && this._isValid(cached, { ...options, path })){
      return this.textDecoder.decode(cached.value);
    }

    const bytes = readFileSync(path);

    this._setValue(this.SHARED_CACHE, path, bytes, new Date(), normalizedPath, normalizedTag);

    return this.textDecoder.decode(bytes);
  }

  public static readJSON(path: string, options: CacheOptions<Uint8Array> = {}): Record<string, unknown> {
    const content = this.readFile(path, options);
    return JSON.parse(content);
  }

  public static get<Value>(key: CacheKey, callback: () => Value, options?: CacheOption & CacheOptions<Value>): Value;
  public static get<Value>(key: CacheKey, callback: () => Promise<Value>, options?: CacheOption & CacheOptions<Value>): Promise<Value>;
  public static get<Value>(key: CacheKey, callback: () => Promise<Value> | Value, { cache = this.SHARED_CACHE, ...options }: CacheOption & CacheOptions<Value> = {}): Promise<Value> | Value {
    const cached = this._getValue<Value>(cache, key);
    const normalizedPath = this._normalizeSource(options.path);
    const normalizedTag = this._normalizeSource(options.tag);

    if(cached && this._isValid(cached, options)){
      if(cache instanceof ShareableMap){
        return this._decodeValue<Value>(cached.value as Uint8Array);
      } else {
        return cached.value;
      }
    }

    const value = callback();

    if(value instanceof Promise){
      return value.then(resolvedValue => {
        this._setValue(cache, key, cache instanceof ShareableMap ? this._encodeValue(resolvedValue) : resolvedValue, new Date(), normalizedPath, normalizedTag);
        return resolvedValue;
      });
    }

    this._setValue(cache, key, cache instanceof ShareableMap ? this._encodeValue(value) : value, new Date(), normalizedPath, normalizedTag);

    return value;
  }

  public static set<Value>(key: CacheKey, value: Value, { cache = this.SHARED_CACHE, ...options }: CacheOption & CacheOptions<Value> = {}): void {
    this._setValue(cache, key, cache instanceof ShareableMap ? this._encodeValue(value) : value, new Date(), this._normalizeSource(options.path), this._normalizeSource(options.tag));
  }

  private static _isValid<Value>(cached: CacheEntry<Value>, options: CacheOptions<Value>): boolean {
    if(options.invalidate === false){
      return true;
    }

    const normalizedPath = this._normalizeSource(options.path);
    const normalizedTag = this._normalizeSource(options.tag);

    if(normalizedPath && invalidateByModifiedDate(cached, normalizedPath)){
      return false;
    }
    if(normalizedTag && invalidateByTagChange(cached, normalizedTag)){
      return false;
    }

    return !options.invalidate?.(cached, normalizedPath ?? normalizedTag);
  }

  private static _setValue(cache: IsolatedCache, key: CacheKey, value: unknown, date: Date, path?: string[] | undefined, tag?: string[] | undefined): void;
  private static _setValue(cache: SharedCache, key: CacheKey, value: Uint8Array, date: Date, path?: string[] | undefined, tag?: string[] | undefined): void;
  private static _setValue(cache: IsolatedCache | SharedCache, key: CacheKey, value: unknown, date: Date, path?: string[] | undefined, tag?: string[] | undefined): void;
  private static _setValue(cache: IsolatedCache | SharedCache, key: CacheKey, value: unknown, date: Date = new Date(), path?: string[] | undefined, tag?: string[] | undefined): void {
    if(cache.size >= this.limit){
      const oldestKey = cache.keys().next().value;
      if(oldestKey !== undefined){
        cache.delete(oldestKey);
      }
    }

    if(cache instanceof ShareableMap && value instanceof Uint8Array){
      cache.set(this._getKey(key), this._serializeData(date, path, tag, value));
    } else {
      cache.set(this._getKey(key), {
        date,
        path,
        tag,
        value
      });
    }
  }

  private static _getValue<Value>(cache: IsolatedCache | SharedCache, key: CacheKey): CacheEntry<Value> | undefined {
    if(cache instanceof ShareableMap){
      return this._parseData(cache.get(this._getKey(key))) as CacheEntry<Value>;
    } else {
      return cache.get(this._getKey(key)) as CacheEntry<Value>;
    }
  }

  private static _getKey(key: CacheKey): CacheKeyHash {
    return this._hashKey(
      JSON.stringify(
        Array.isArray(key)
          ? key.filter(part => part !== undefined)
          : key
      )
    ) as CacheKeyHash;
  }

  private static _normalizeSource(source: CacheSource): string[] | undefined {
    if(source === undefined){
      return;
    }

    if(!Array.isArray(source)){
      return [source];
    }

    const defined = source.filter((part): part is string => part !== undefined);

    return defined.length === 0 ? undefined : defined;
  }

  private static _hashKey(key: string) {
    return hash("sha256", key, "hex").slice(0, 32);
  }

  private static _encodeValue<Value>(value: Value): Uint8Array {
    return this.textEncoder.encode(JSON.stringify({ value }));
  }

  private static _decodeValue<Value>(bytes: Uint8Array): Value {
    return JSON.parse(this.textDecoder.decode(bytes)).value as Value;
  }

  /**
   * Flattens a cache entry into a single `Uint8Array` for storage in the shared
   * (cross-worker) cache, which can only hold raw bytes — not JS objects.
   *
   * The three variable-length string fields (`date`, `path`, `tag`) each need a
   * length prefix so they can be split back apart when parsing. Each length is a
   * 4-byte unsigned integer written immediately before the data it describes.
   *
   * ```
   * ┌──────────┬───────────┬──────────┬───────────┬──────────┬──────────┬───────────┐
   * │ dateLen  │ date      │ pathLen  │ path      │ tagLen   │ tag      │ value     │
   * │ (4 B)    │ (dateLen) │ (4 B)    │ (pathLen) │ (4 B)    │ (tagLen) │ (rest)    │
   * └──────────┴───────────┴──────────┴───────────┴──────────┴──────────┴───────────┘
   *   offset 0   offset 4
   * ```
   *
   * That is three 4-byte length headers (12 bytes total) plus the data itself,
   * i.e. `12 + dateLen + pathLen + tagLen + valueLen`. The `value` payload needs no
   * length prefix because it always runs to the end of the buffer.
   *
   * @param date The date the entry was created.
   * @param path The file paths used for modification-time invalidation.
   * @param tag The arbitrary values used for equality-based invalidation.
   * @param value The raw payload bytes.
   * @returns The serialized entry.
   */
  private static _serializeData(date: Date, path: string[] | undefined, tag: string[] | undefined, value: Uint8Array): Uint8Array {
    const dateBytes = this.textEncoder.encode(date.toISOString());
    const pathBytes = this.textEncoder.encode(path === undefined ? "" : JSON.stringify(path));
    const tagBytes = this.textEncoder.encode(tag === undefined ? "" : JSON.stringify(tag));
    const result = new Uint8Array(12 + dateBytes.byteLength + pathBytes.byteLength + tagBytes.byteLength + value.byteLength);

    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
    view.setUint32(0, dateBytes.byteLength);
    view.setUint32(4 + dateBytes.byteLength, pathBytes.byteLength);
    view.setUint32(8 + dateBytes.byteLength + pathBytes.byteLength, tagBytes.byteLength);

    result.set(dateBytes, 4);
    result.set(pathBytes, 8 + dateBytes.byteLength);
    result.set(tagBytes, 12 + dateBytes.byteLength + pathBytes.byteLength);
    result.set(value, 12 + dateBytes.byteLength + pathBytes.byteLength + tagBytes.byteLength);

    return result;
  }

  /**
   * Reconstructs a cache entry from the flat byte layout produced by
   * {@link Cache._serializeData}. Returns `undefined` when the key is absent.
   *
   * @param bytes The serialized entry bytes.
   * @returns The parsed cache entry, or `undefined` if there is nothing to parse.
   */
  private static _parseData(bytes: Uint8Array): CacheEntry<Uint8Array> | undefined {
    if(!bytes){
      return;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const dateLength = view.getUint32(0);
    const pathLengthOffset = 4 + dateLength;
    const pathLength = view.getUint32(pathLengthOffset);
    const tagLengthOffset = pathLengthOffset + 4 + pathLength;
    const tagLength = view.getUint32(tagLengthOffset);
    const valueOffset = tagLengthOffset + 4 + tagLength;
    const dateBytes = bytes.subarray(4, pathLengthOffset);
    const pathBytes = bytes.subarray(pathLengthOffset + 4, tagLengthOffset);
    const tagBytes = bytes.subarray(tagLengthOffset + 4, valueOffset);
    const value = bytes.subarray(valueOffset);

    const parseSource = (sourceBytes: Uint8Array): string[] | undefined => {
      if(sourceBytes.byteLength === 0){
        return;
      }

      const parsed = JSON.parse(this.textDecoder.decode(sourceBytes));

      if(Array.isArray(parsed)){
        return parsed;
      }

      return [parsed];
    };

    return {
      date: new Date(this.textDecoder.decode(dateBytes)),
      path: parseSource(pathBytes),
      tag: parseSource(tagBytes),
      value
    };
  }

}

export function invalidateByModifiedDate(cache: CacheEntry, paths: CacheSource): boolean {
  const normalizedPaths = Array.isArray(paths)
    ? paths.filter((part): part is string => part !== undefined)
    : paths === undefined
      ? []
      : [paths];

  if(normalizedPaths.length === 0 || cache.path === undefined){
    return cache.path !== undefined || normalizedPaths.length > 0;
  }

  if(normalizedPaths.length !== cache.path.length){
    return true;
  }

  for(let index = 0; index < normalizedPaths.length; index++){
    const path = normalizedPaths[index];
    const cachedPath = cache.path[index];

    if(path !== cachedPath){
      return true;
    }

    const modified = getModifiedDate(path);

    if(modified === undefined || modified > cache.date){
      return true;
    }
  }

  return false;
}

export function invalidateByTagChange(cache: CacheEntry, tags: CacheSource): boolean {
  const normalizedTags = Array.isArray(tags)
    ? tags.filter((part): part is string => part !== undefined)
    : tags === undefined
      ? []
      : [tags];

  if(normalizedTags.length === 0 || cache.tag === undefined){
    return cache.tag !== undefined || normalizedTags.length > 0;
  }

  if(normalizedTags.length !== cache.tag.length){
    return true;
  }

  for(let index = 0; index < normalizedTags.length; index++){
    if(normalizedTags[index] !== cache.tag[index]){
      return true;
    }
  }

  return false;
}
