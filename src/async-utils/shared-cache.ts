import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { Readable, Writable } from "node:stream";


export interface CacheOptions {
  initialDataCapacity: number;
  initialMetadataCapacity: number;
  maxDataCapacity: number;
  maxMetadataCapacity: number;
}

// the version is the version of the key or path entry at the time the dependent value was created
export type CacheDependency = { key: string; version: number; } | { path: string; version: number; };

export interface CacheEntryOptions {
  dependencies?: readonly CacheDependency[];
  path?: string;
}

export interface CacheStats {
  dataCapacity: number;
  entries: number;
  freeBytes: number;
  keys: string[];
  largestFreeRegion: number;
  metadataCapacity: number;
  metadataUsedBytes: number;
  pinnedEntries: number;
  staleEntries: number;
  usedBytes: number;
  writingEntries: number;
}

const HEADER = 56;
const MAGIC = 0x53_54_41_45;
export const MAX_BUFFER_CAPACITY = 0x7F_FF_FF_F8;
const ENTRY_SIZE = 88;
const DEPENDENCY_SIZE = 24;
const MAX_DEPENDENCY_DEPTH = 32;
const INITIAL_BUCKETS = 16;
const STREAM_CHUNK_SIZE = 64 * 1024;

const HEADER_FIELDS = {
  bucketCount: 20,
  buckets: 16,
  clock: 40,
  count: 24,
  dataEnd: 32,
  dataFree: 36,
  end: 8,
  entries: 28,
  free: 12,
  magic: 0,
  resetRequested: 4,
  tail: 48
};
const ENTRY_FIELDS = {
  capacity: 16,
  createdAt: 40,
  dependencies: 48,
  hash: 28,
  hashNext: 4,
  invalid: 64,
  key: 88,
  keyLength: 60,
  kind: 56,
  length: 12,
  next: 0,
  offset: 8,
  previous: 52,
  readers: 24,
  state: 20,
  timestamp: 32,
  validatedAt: 80,
  version: 72
};
const DEPENDENCY_FIELDS = {
  hash: 4,
  key: 24,
  keyLength: 12,
  kind: 8,
  next: 0,
  version: 16
};
const WRITING = 1;
const LIVE = 2;
const RETIRED = 3;
const FREE = 4;
const KEY = 1;
const PATH = 2;

// thrown when a buffer would have to grow beyond its maximum capacity
export class SharedCacheCapacityError extends RangeError {
  constructor() {
    super("SharedCache capacity exhausted");
  }
}

function align(value: number): number {
  return Math.ceil(value / 8) * 8;
}

function validateCapacity(value: number, name: string): void {
  if(!Number.isSafeInteger(value) || value < 0 || value > MAX_BUFFER_CAPACITY){
    throw new RangeError(`${name} must be an integer between 0 and ${MAX_BUFFER_CAPACITY}`);
  }
}

// fnv-1a over the utf-16le bytes, computed from the char codes without encoding the text first
function hashText(text: string, kind: number): number {
  let hash = kind;
  for(let index = 0; index < text.length; index++){
    const code = text.charCodeAt(index);
    hash = Math.imul(hash ^ code & 0xFF, 16_777_619) >>> 0;
    hash = Math.imul(hash ^ code >>> 8, 16_777_619) >>> 0;
  }
  return hash;
}

// returns the current modification time of a path, used to refresh the paths an entry depends on
export type ModifiedTime = (path: string) => number;

export class SharedCache {
  readonly metadata: SharedArrayBuffer;
  readonly data: SharedArrayBuffer;
  private readonly metadataView: DataView;
  private readonly metadataBytes: Uint8Array;

  private constructor(metadata: SharedArrayBuffer, data: SharedArrayBuffer) {
    this.metadata = metadata;
    this.data = data;
    this.metadataView = new DataView(metadata);
    this.metadataBytes = new Uint8Array(metadata);
  }

  static create(options: CacheOptions): SharedCache {
    for(const name of ["initialDataCapacity", "maxDataCapacity", "initialMetadataCapacity", "maxMetadataCapacity"] as const){
      validateCapacity(options[name], name);
    }
    if(options.initialMetadataCapacity < HEADER + 8 + INITIAL_BUCKETS * 4 ||
      options.initialMetadataCapacity > options.maxMetadataCapacity ||
      options.initialDataCapacity > options.maxDataCapacity){
      throw new RangeError(`Invalid initial or maximum buffer capacity (metadata requires at least ${HEADER + 8 + INITIAL_BUCKETS * 4} bytes)`);
    }
    const metadata = new SharedArrayBuffer(options.initialMetadataCapacity, { maxByteLength: options.maxMetadataCapacity });
    const data = new SharedArrayBuffer(options.initialDataCapacity, { maxByteLength: options.maxDataCapacity });
    if(!metadata.growable || !data.growable){
      throw new Error("SharedCache requires growable SharedArrayBuffer support");
    }
    const cache = new SharedCache(metadata, data);
    cache.writeUint32(HEADER_FIELDS.end, HEADER);
    cache.writeUint32(HEADER_FIELDS.bucketCount, INITIAL_BUCKETS);
    cache.writeUint32(HEADER_FIELDS.buckets, cache.allocateMetadata(INITIAL_BUCKETS * 4));
    cache.writeUint32(HEADER_FIELDS.magic, MAGIC);
    return cache;
  }

  static attach(metadata: SharedArrayBuffer, data: SharedArrayBuffer): SharedCache {
    if(!(metadata instanceof SharedArrayBuffer) || !(data instanceof SharedArrayBuffer) ||
      metadata === data || !metadata.growable || !data.growable || metadata.byteLength < HEADER ||
      new DataView(metadata).getUint32(HEADER_FIELDS.magic, true) !== MAGIC){
      throw new TypeError("Expected initialized growable SharedCache buffers");
    }
    return new SharedCache(metadata, data);
  }

  // passing `modified` records the current modification times of the paths the entry depends on directly
  // entries that only depend on it transitively compare the recorded versions and never access the file system
  get(key: string, modified?: ModifiedTime): Uint8Array | undefined {
    const entry = this.lookup(key, modified);
    if(entry && !this.stale(entry)){
      this.touch(entry);
      return this.payload(entry).slice();
    }
  }

  has(key: string, modified?: ModifiedTime): boolean {
    const entry = this.lookup(key, modified);
    if(entry && !this.stale(entry)){
      this.touch(entry);
      return true;
    }
    return false;
  }

  // the version of a valid entry changes whenever the entry is written with a different value
  // entries that depend on it record this version and become stale when it changes
  version(key: string, modified?: ModifiedTime): number | undefined {
    const entry = this.lookup(key, modified);
    if(entry && !this.stale(entry)){
      this.touch(entry);
      return this.readFloat64(entry + ENTRY_FIELDS.version);
    }
  }

  // the paths the current entry depends on directly, regardless of whether the entry is still valid
  pathDependencies(key: string): string[] {
    const entry = this.find(key, KEY);
    const paths: string[] = [];
    for(let dependency = entry ? this.readUint32(entry + ENTRY_FIELDS.dependencies) : 0; dependency; dependency = this.readUint32(dependency + DEPENDENCY_FIELDS.next)){
      if(this.readUint32(dependency + DEPENDENCY_FIELDS.kind) === PATH){
        paths.push(this.text(dependency + DEPENDENCY_FIELDS.key, this.readUint32(dependency + DEPENDENCY_FIELDS.keyLength)));
      }
    }
    return paths;
  }

  set(key: string, data: Uint8Array, options: CacheEntryOptions = {}): void {
    const previous = this.find(key, KEY);
    let version: number | undefined;
    if(previous && this.payloadEquals(previous, data)){
      // an identical valid entry does not need to be written again
      if(!this.stale(previous)){
        this.touch(previous);
        return;
      }
      // the value did not change, so entries that were derived from it stay valid
      version = this.readFloat64(previous + ENTRY_FIELDS.version);
    }
    const entry = this.reserve(key, data.byteLength, options, version);
    try {
      this.payload(entry).set(data);
      // a dependency may have been evicted to make room for the entry, which is then not worth caching
      if(this.readUint32(entry + ENTRY_FIELDS.invalid) === 0 && this.stale(entry)){
        this.retire(entry);
        return;
      }
      this.publish(entry);
    } catch (error){
      this.retire(entry);
      throw error;
    }
  }

  createWriteStream(key: string, expectedLength: number, options: CacheEntryOptions = {}): Writable {
    let reservation = this.reserve(key, expectedLength, options);
    let written = 0;
    return new Writable({
      destroy: (error, callback) => {
        if(reservation){
          this.retire(reservation);
          reservation = 0;
        }
        callback(error);
      },
      final: callback => {
        try {
          if(written !== expectedLength){
            throw new RangeError("Cache stream ended before expected length");
          }
          this.publish(reservation);
          reservation = 0;
          callback();
        } catch (error){
          callback(error as Error);
        }
      },
      highWaterMark: STREAM_CHUNK_SIZE,
      write: (chunk: Buffer, _encoding, callback) => {
        try {
          if(written + chunk.byteLength > expectedLength){
            throw new RangeError("Cache stream exceeded expected length");
          }
          this.payload(reservation).set(chunk, written);
          written += chunk.byteLength;
          callback();
        } catch (error){
          callback(error as Error);
        }
      }
    });
  }

  createReadStream(key: string): Readable {
    const entry = this.find(key, KEY);
    if(!entry || this.stale(entry)){
      throw new Error("Cache entry is missing or stale");
    }
    this.payload(entry);
    this.writeUint32(entry + ENTRY_FIELDS.readers, this.readUint32(entry + ENTRY_FIELDS.readers) + 1);
    let position = 0;
    let released = false;
    const release = (): void => {
      if(released){
        return;
      }
      released = true;
      const readers = this.readUint32(entry + ENTRY_FIELDS.readers) - 1;
      this.writeUint32(entry + ENTRY_FIELDS.readers, readers);
      if(!readers && this.readUint32(entry + ENTRY_FIELDS.state) === RETIRED){
        this.release(entry);
      }
    };
    const stream = new Readable({
      destroy: (error, callback) => {
        release();
        callback(error);
      },
      highWaterMark: STREAM_CHUNK_SIZE,
      read: size => {
        try {
          const payload = this.payload(entry);
          if(position === payload.length){
            stream.push(null);
            return;
          }
          const chunkLength = Math.max(1, Math.min(size, STREAM_CHUNK_SIZE));
          const end = Math.min(payload.length, position + chunkLength);
          const chunk = payload.slice(position, end);
          position = end;
          stream.push(chunk);
        } catch (error){
          stream.destroy(error as Error);
        }
      }
    });
    stream.once("end", release);
    return stream;
  }

  setFile(key: string, filePath: string, options: CacheEntryOptions = {}): void {
    const descriptor = openSync(filePath, "r");
    let reservation = 0;
    try {
      const length = fstatSync(descriptor).size;
      reservation = this.reserve(key, length, options);
      const destination = this.payload(reservation);
      let position = 0;
      while(position < length){
        const chunkLength = Math.min(length - position, STREAM_CHUNK_SIZE);
        const received = readSync(descriptor, destination, position, chunkLength, position);
        if(!received){
          throw new Error("File ended before expected length");
        }
        position += received;
      }
      if(readSync(descriptor, new Uint8Array(1), 0, 1, position)){
        throw new Error("File exceeded expected length");
      }
      this.publish(reservation);
      reservation = 0;
    } finally {
      if(reservation){
        this.retire(reservation);
      }
      closeSync(descriptor);
    }
  }

  delete(key: string): boolean {
    const entry = this.find(key, KEY);
    if(!entry){
      return false;
    }
    this.unlinkHash(entry);
    this.retire(entry);
    return true;
  }

  clear(): void {
    let entry = this.readUint32(HEADER_FIELDS.entries);
    while(entry){
      const next = this.readUint32(entry + ENTRY_FIELDS.next);
      const state = this.readUint32(entry + ENTRY_FIELDS.state);
      if(state === WRITING){
        this.writeUint32(entry + ENTRY_FIELDS.invalid, 1);
      } else if(state === LIVE){
        this.unlinkHash(entry);
        this.retire(entry);
      }
      entry = next;
    }
  }

  // records the modification time of a path and returns its version, which only changes when the time changes
  recordPathUpdate(path: string, timestamp = Date.now()): number {
    if(!Number.isFinite(timestamp)){
      throw new RangeError("Path timestamp must be finite");
    }
    const entry = this.find(path, PATH);
    if(!entry){
      return this.readFloat64(this.createPath(path, timestamp) + ENTRY_FIELDS.version);
    }
    if(this.readFloat64(entry + ENTRY_FIELDS.timestamp) !== timestamp){
      this.updatePath(entry, timestamp);
    }
    return this.readFloat64(entry + ENTRY_FIELDS.version);
  }

  pathVersion(path: string): number | undefined {
    const entry = this.find(path, PATH);
    return entry ? this.readFloat64(entry + ENTRY_FIELDS.version) : undefined;
  }

  getPathLastModified(path: string): number | undefined {
    const entry = this.find(path, PATH);
    return entry ? this.readFloat64(entry + ENTRY_FIELDS.timestamp) : undefined;
  }

  invalidatePath(path: string): void {
    const entry = this.find(path, PATH) || this.createPath(path, 0);
    const previous = this.readFloat64(entry + ENTRY_FIELDS.timestamp);
    let timestamp = Math.max(Date.now(), previous + 1);
    if(timestamp === previous){
      timestamp = previous === 0 ? 1 : -previous;
    }
    this.updatePath(entry, timestamp);
  }

  // lets an attached thread ask the owner of the buffers to replace them, for example once they are exhausted
  requestReset(): void {
    this.writeUint32(HEADER_FIELDS.resetRequested, 1);
  }

  get resetRequested(): boolean {
    return this.readUint32(HEADER_FIELDS.resetRequested) === 1;
  }

  isStale(key: string): boolean {
    const entry = this.find(key, KEY);
    return !!entry && this.stale(entry);
  }

  getStats(): CacheStats {
    const tail = this.data.byteLength - this.readUint32(HEADER_FIELDS.dataEnd);
    const stats: CacheStats = {
      dataCapacity: this.data.byteLength,
      entries: 0,
      freeBytes: tail,
      keys: [],
      largestFreeRegion: tail,
      metadataCapacity: this.metadata.byteLength,
      metadataUsedBytes: this.readUint32(HEADER_FIELDS.end),
      pinnedEntries: 0,
      staleEntries: 0,
      usedBytes: 0,
      writingEntries: 0
    };
    for(let entry = this.readUint32(HEADER_FIELDS.entries); entry; entry = this.readUint32(entry + ENTRY_FIELDS.next)){
      stats.usedBytes += this.readUint32(entry + ENTRY_FIELDS.capacity);
      if(this.readUint32(entry + ENTRY_FIELDS.readers)){
        stats.pinnedEntries++;
      }
      const state = this.readUint32(entry + ENTRY_FIELDS.state);
      if(state === WRITING){
        stats.writingEntries++;
      } else if(state === LIVE && this.readUint32(entry + ENTRY_FIELDS.kind) === KEY){
        if(this.stale(entry)){
          stats.staleEntries++;
        } else {
          stats.entries++;
          stats.keys.push(this.text(entry + ENTRY_FIELDS.key, this.readUint32(entry + ENTRY_FIELDS.keyLength)));
        }
      }
    }
    for(let extent = this.readUint32(HEADER_FIELDS.dataFree); extent; extent = this.readUint32(extent + ENTRY_FIELDS.next)){
      const size = this.readUint32(extent + ENTRY_FIELDS.capacity);
      stats.freeBytes += size;
      stats.largestFreeRegion = Math.max(stats.largestFreeRegion, size);
    }
    return stats;
  }

  private readUint32(offset: number): number {
    return this.metadataView.getUint32(offset, true);
  }

  private writeUint32(offset: number, value: number): void {
    this.metadataView.setUint32(offset, value, true);
  }

  private readFloat64(offset: number): number {
    return this.metadataView.getFloat64(offset, true);
  }

  private writeFloat64(offset: number, value: number): void {
    this.metadataView.setFloat64(offset, value, true);
  }

  private nextTimestamp(): number {
    const timestamp = this.readFloat64(HEADER_FIELDS.clock) + 1;
    if(!Number.isSafeInteger(timestamp)){
      throw new RangeError("SharedCache logical clock exhausted");
    }
    this.writeFloat64(HEADER_FIELDS.clock, timestamp);
    return timestamp;
  }

  private grow(buffer: SharedArrayBuffer, required: number): void {
    if(required > buffer.maxByteLength){
      throw new SharedCacheCapacityError();
    }
    buffer.grow(Math.min(buffer.maxByteLength, Math.max(required, buffer.byteLength * 2, 8)));
  }

  private allocateMetadata(size: number): number {
    const total = align(size + 8);
    if(HEADER + total > this.metadata.maxByteLength){
      throw new SharedCacheCapacityError();
    }
    for(let reclaimed = false; ; reclaimed = true){
      const block = this.allocateFreeBlock(total);
      if(block){
        return block;
      }
      const end = this.readUint32(HEADER_FIELDS.end);
      if(end + total <= this.metadata.maxByteLength){
        if(end + total > this.metadata.byteLength){
          this.grow(this.metadata, end + total);
        }
        this.writeUint32(end, total);
        this.writeUint32(HEADER_FIELDS.end, end + total);
        this.metadataBytes.fill(0, end + 8, end + total);
        return end + 8;
      }
      // the arena is at its maximum, stale entries go first, then the least recently used ones
      if(!reclaimed){
        this.reclaimStale();
      } else if(!this.evict()){
        throw new SharedCacheCapacityError();
      }
    }
  }

  private allocateFreeBlock(total: number): number {
    let link = HEADER_FIELDS.free;
    for(let block = this.readUint32(link); block; block = this.readUint32(link)){
      const available = this.readUint32(block);
      if(available >= total){
        const next = this.readUint32(block + 4);
        if(available - total >= 16){
          const remainder = block + total;
          this.writeUint32(remainder, available - total);
          this.writeUint32(remainder + 4, next);
          this.writeUint32(link, remainder);
          this.writeUint32(block, total);
        } else {
          this.writeUint32(link, next);
        }
        this.metadataBytes.fill(0, block + 8, block + this.readUint32(block));
        return block + 8;
      }
      link = block + 4;
    }
    return 0;
  }

  private freeMetadata(offset: number): void {
    const block = offset - 8;
    let previous = 0;
    let next = this.readUint32(HEADER_FIELDS.free);
    while(next && next < block){
      previous = next;
      next = this.readUint32(next + 4);
    }
    this.writeUint32(block + 4, next);
    this.writeUint32(previous ? previous + 4 : HEADER_FIELDS.free, block);
    if(next && block + this.readUint32(block) === next){
      this.writeUint32(block, this.readUint32(block) + this.readUint32(next));
      this.writeUint32(block + 4, this.readUint32(next + 4));
    }
    if(previous && previous + this.readUint32(previous) === block){
      this.writeUint32(previous, this.readUint32(previous) + this.readUint32(block));
      this.writeUint32(previous + 4, this.readUint32(block + 4));
    }
  }

  private bucket(hash: number): number {
    return this.readUint32(HEADER_FIELDS.buckets) + hash % this.readUint32(HEADER_FIELDS.bucketCount) * 4;
  }

  private lookup(key: string, modified: ModifiedTime | undefined): number {
    const entry = this.find(key, KEY);
    if(entry && modified){
      // creating path entries may evict, the entry is pinned so that its dependencies stay readable
      this.writeUint32(entry + ENTRY_FIELDS.readers, this.readUint32(entry + ENTRY_FIELDS.readers) + 1);
      try {
        this.refresh(entry, modified);
      } finally {
        this.writeUint32(entry + ENTRY_FIELDS.readers, this.readUint32(entry + ENTRY_FIELDS.readers) - 1);
      }
    }
    return entry;
  }

  private refresh(entry: number, modified: ModifiedTime): void {
    for(let dependency = this.readUint32(entry + ENTRY_FIELDS.dependencies); dependency; dependency = this.readUint32(dependency + DEPENDENCY_FIELDS.next)){
      if(this.readUint32(dependency + DEPENDENCY_FIELDS.kind) !== PATH){
        continue;
      }
      const length = this.readUint32(dependency + DEPENDENCY_FIELDS.keyLength);
      const path = this.findStored(this.readUint32(dependency + DEPENDENCY_FIELDS.hash), PATH, dependency + DEPENDENCY_FIELDS.key, length);
      const timestamp = modified(this.text(dependency + DEPENDENCY_FIELDS.key, length));
      if(!path){
        this.createPath(this.text(dependency + DEPENDENCY_FIELDS.key, length), timestamp);
      } else if(this.readFloat64(path + ENTRY_FIELDS.timestamp) !== timestamp){
        this.updatePath(path, timestamp);
      }
    }
  }

  // the published entry of a key or path, the hash table only contains live entries
  private find(key: string, kind: number): number {
    const hash = hashText(key, kind);
    const length = key.length * 2;
    for(let entry = this.readUint32(this.bucket(hash)); entry; entry = this.readUint32(entry + ENTRY_FIELDS.hashNext)){
      if(this.readUint32(entry + ENTRY_FIELDS.hash) === hash && this.readUint32(entry + ENTRY_FIELDS.kind) === kind &&
        this.readUint32(entry + ENTRY_FIELDS.keyLength) === length && this.matchesText(entry + ENTRY_FIELDS.key, key)){
        return entry;
      }
    }
    return 0;
  }

  // the same lookup for a key that is stored in the metadata, without decoding it
  private findStored(hash: number, kind: number, key: number, length: number, start = this.readUint32(this.bucket(hash))): number {
    for(let entry = start; entry; entry = this.readUint32(entry + ENTRY_FIELDS.hashNext)){
      if(this.readUint32(entry + ENTRY_FIELDS.hash) === hash && this.readUint32(entry + ENTRY_FIELDS.kind) === kind &&
        this.readUint32(entry + ENTRY_FIELDS.keyLength) === length && this.matchesBytes(entry + ENTRY_FIELDS.key, key, length)){
        return entry;
      }
    }
    return 0;
  }

  private matchesText(offset: number, text: string): boolean {
    for(let index = 0; index < text.length; index++){
      if(this.metadataView.getUint16(offset + index * 2, true) !== text.charCodeAt(index)){
        return false;
      }
    }
    return true;
  }

  private matchesBytes(first: number, second: number, length: number): boolean {
    let index = 0;
    for(; index + 4 <= length; index += 4){
      if(this.readUint32(first + index) !== this.readUint32(second + index)){
        return false;
      }
    }
    for(; index < length; index += 2){
      if(this.metadataView.getUint16(first + index, true) !== this.metadataView.getUint16(second + index, true)){
        return false;
      }
    }
    return true;
  }

  private writeText(offset: number, text: string): void {
    for(let index = 0; index < text.length; index++){
      this.metadataView.setUint16(offset + index * 2, text.charCodeAt(index), true);
    }
  }

  private text(offset: number, length: number): string {
    return Buffer.from(this.metadataBytes.subarray(offset, offset + length)).toString("utf16le");
  }

  private linkHash(entry: number): void {
    if(this.readUint32(HEADER_FIELDS.count) >= this.readUint32(HEADER_FIELDS.bucketCount) * 2){
      this.rehash();
    }
    const bucket = this.bucket(this.readUint32(entry + ENTRY_FIELDS.hash));
    this.writeUint32(entry + ENTRY_FIELDS.hashNext, this.readUint32(bucket));
    this.writeUint32(bucket, entry);
    this.writeUint32(HEADER_FIELDS.count, this.readUint32(HEADER_FIELDS.count) + 1);
  }

  private unlinkHash(entry: number): void {
    // entries that depend on it may become stale, which has to invalidate remembered validations
    this.nextTimestamp();
    let link = this.bucket(this.readUint32(entry + ENTRY_FIELDS.hash));
    for(let current = this.readUint32(link); current; current = this.readUint32(link)){
      if(current === entry){
        this.writeUint32(link, this.readUint32(entry + ENTRY_FIELDS.hashNext));
        this.writeUint32(entry + ENTRY_FIELDS.hashNext, 0);
        this.writeUint32(HEADER_FIELDS.count, this.readUint32(HEADER_FIELDS.count) - 1);
        return;
      }
      link = current + ENTRY_FIELDS.hashNext;
    }
  }

  private rehash(): void {
    const old = this.readUint32(HEADER_FIELDS.buckets);
    const count = this.readUint32(HEADER_FIELDS.bucketCount);
    const replacement = this.allocateMetadata(count * 8);
    for(let index = 0; index < count; index++){
      let entry = this.readUint32(old + index * 4);
      while(entry){
        const next = this.readUint32(entry + ENTRY_FIELDS.hashNext);
        const bucket = replacement + this.readUint32(entry + ENTRY_FIELDS.hash) % (count * 2) * 4;
        this.writeUint32(entry + ENTRY_FIELDS.hashNext, this.readUint32(bucket));
        this.writeUint32(bucket, entry);
        entry = next;
      }
    }
    this.writeUint32(HEADER_FIELDS.buckets, replacement);
    this.writeUint32(HEADER_FIELDS.bucketCount, count * 2);
    this.freeMetadata(old);
  }

  // entry records contain their key, so they can be found and freed without any other record
  private allocateEntry(key: string, kind: number): number {
    const entry = this.allocateMetadata(ENTRY_SIZE + key.length * 2);
    this.writeUint32(entry + ENTRY_FIELDS.hash, hashText(key, kind));
    this.writeUint32(entry + ENTRY_FIELDS.kind, kind);
    this.writeUint32(entry + ENTRY_FIELDS.keyLength, key.length * 2);
    this.writeText(entry + ENTRY_FIELDS.key, key);
    return entry;
  }

  // paths are entries without payload, their version changes whenever their timestamp changes
  private createPath(path: string, timestamp: number): number {
    const version = this.nextTimestamp();
    const entry = this.allocateEntry(path, PATH);
    this.writeUint32(entry + ENTRY_FIELDS.state, LIVE);
    this.writeFloat64(entry + ENTRY_FIELDS.createdAt, version);
    this.writeFloat64(entry + ENTRY_FIELDS.version, version);
    this.writeFloat64(entry + ENTRY_FIELDS.timestamp, timestamp);
    try {
      this.linkHash(entry);
    } catch (error){
      this.freeMetadata(entry);
      throw error;
    }
    this.linkEntry(entry);
    return entry;
  }

  private updatePath(entry: number, timestamp: number): void {
    this.writeFloat64(entry + ENTRY_FIELDS.timestamp, timestamp);
    this.writeFloat64(entry + ENTRY_FIELDS.version, this.nextTimestamp());
  }

  private makeDependencies(dependencies: readonly CacheDependency[]): number {
    let head = 0;
    try {
      for(const dependency of dependencies){
        const [key, kind] = "key" in dependency ? [dependency.key, KEY] : [dependency.path, PATH];
        const node = this.allocateMetadata(DEPENDENCY_SIZE + key.length * 2);
        this.writeUint32(node + DEPENDENCY_FIELDS.next, head);
        this.writeUint32(node + DEPENDENCY_FIELDS.hash, hashText(key, kind));
        this.writeUint32(node + DEPENDENCY_FIELDS.kind, kind);
        this.writeUint32(node + DEPENDENCY_FIELDS.keyLength, key.length * 2);
        this.writeFloat64(node + DEPENDENCY_FIELDS.version, dependency.version);
        this.writeText(node + DEPENDENCY_FIELDS.key, key);
        head = node;
      }
      return head;
    } catch (error){
      this.freeDependencies(head);
      throw error;
    }
  }

  private freeDependencies(head: number): void {
    while(head){
      const next = this.readUint32(head + DEPENDENCY_FIELDS.next);
      this.freeMetadata(head);
      head = next;
    }
  }

  // dependencies store their key and are looked up again, so they never point to freed records
  private stale(entry: number, depth = 0): boolean {
    if(this.readUint32(entry + ENTRY_FIELDS.invalid)){
      return true;
    }
    // the clock advances with every change that can make an entry stale, so a validation stays valid until then
    const clock = this.readFloat64(HEADER_FIELDS.clock);
    if(this.readFloat64(entry + ENTRY_FIELDS.validatedAt) === clock){
      return false;
    }
    for(let dependency = this.readUint32(entry + ENTRY_FIELDS.dependencies); dependency; dependency = this.readUint32(dependency + DEPENDENCY_FIELDS.next)){
      const kind = this.readUint32(dependency + DEPENDENCY_FIELDS.kind);
      const target = this.findStored(
        this.readUint32(dependency + DEPENDENCY_FIELDS.hash),
        kind,
        dependency + DEPENDENCY_FIELDS.key,
        this.readUint32(dependency + DEPENDENCY_FIELDS.keyLength)
      );
      if(!target || this.readFloat64(target + ENTRY_FIELDS.version) !== this.readFloat64(dependency + DEPENDENCY_FIELDS.version)){
        return true;
      }
      // entries are only as valid as the entries they are derived from
      if(kind === KEY && (depth >= MAX_DEPENDENCY_DEPTH || this.stale(target, depth + 1))){
        return true;
      }
    }
    this.writeFloat64(entry + ENTRY_FIELDS.validatedAt, clock);
    return false;
  }

  private reserve(key: string, length: number, options: CacheEntryOptions, version?: number): number {
    validateCapacity(length, "Payload length");
    const createdAt = this.nextTimestamp();
    let dependencies = options.dependencies ?? [];
    if(options.path !== undefined){
      // the entry becomes stale as soon as the timestamp of its path changes
      const path = this.find(options.path, PATH) || this.createPath(options.path, 0);
      dependencies = [...dependencies, { path: options.path, version: this.readFloat64(path + ENTRY_FIELDS.version) }];
    }
    const head = this.makeDependencies(dependencies);
    let entry = 0;
    try {
      entry = this.allocateEntry(key, KEY);
      const offset = this.allocateData(length);
      this.writeUint32(entry + ENTRY_FIELDS.offset, offset);
      this.writeUint32(entry + ENTRY_FIELDS.length, length);
      this.writeUint32(entry + ENTRY_FIELDS.capacity, length);
      this.writeUint32(entry + ENTRY_FIELDS.state, WRITING);
      this.writeUint32(entry + ENTRY_FIELDS.dependencies, head);
      this.writeFloat64(entry + ENTRY_FIELDS.createdAt, createdAt);
      this.writeFloat64(entry + ENTRY_FIELDS.version, version ?? createdAt);
      this.linkEntry(entry);
      return entry;
    } catch (error){
      this.freeDependencies(head);
      if(entry){
        this.freeMetadata(entry);
      }
      throw error;
    }
  }

  private allocateData(length: number): number {
    if(!length){
      return 0;
    }
    if(length > this.data.maxByteLength){
      throw new SharedCacheCapacityError();
    }
    for(let reclaimed = false; ; reclaimed = true){
      const extent = this.allocateFreeExtent(length);
      if(extent !== undefined){
        return extent;
      }
      const offset = this.readUint32(HEADER_FIELDS.dataEnd);
      // stale entries are reclaimed before growing, the least recently used ones are only evicted at the maximum
      if(offset + length > this.data.byteLength && !reclaimed){
        this.reclaimStale();
        continue;
      }
      if(offset + length <= this.data.maxByteLength){
        if(offset + length > this.data.byteLength){
          this.grow(this.data, offset + length);
        }
        this.writeUint32(HEADER_FIELDS.dataEnd, offset + length);
        return offset;
      }
      if(!this.evict()){
        throw new SharedCacheCapacityError();
      }
    }
  }

  // evicts the least recently used entry that is not being written, read, or a path
  private evict(): boolean {
    for(let entry = this.readUint32(HEADER_FIELDS.tail); entry; entry = this.readUint32(entry + ENTRY_FIELDS.previous)){
      if(this.readUint32(entry + ENTRY_FIELDS.state) === LIVE && this.readUint32(entry + ENTRY_FIELDS.kind) === KEY &&
        !this.readUint32(entry + ENTRY_FIELDS.readers)){
        this.unlinkHash(entry);
        this.retire(entry);
        return true;
      }
    }
    return false;
  }

  private allocateFreeExtent(length: number): number | undefined {
    let nextExtentField = HEADER_FIELDS.dataFree;
    for(let extent = this.readUint32(nextExtentField); extent; extent = this.readUint32(nextExtentField)){
      const available = this.readUint32(extent + ENTRY_FIELDS.capacity);
      if(available < length){
        nextExtentField = extent + ENTRY_FIELDS.next;
        continue;
      }
      const offset = this.readUint32(extent + ENTRY_FIELDS.offset);
      if(available === length){
        this.writeUint32(nextExtentField, this.readUint32(extent + ENTRY_FIELDS.next));
        this.freeMetadata(extent);
      } else {
        this.writeUint32(extent + ENTRY_FIELDS.offset, offset + length);
        this.writeUint32(extent + ENTRY_FIELDS.capacity, available - length);
      }
      return offset;
    }
  }

  private reclaimStale(): void {
    let entry = this.readUint32(HEADER_FIELDS.entries);
    while(entry){
      const next = this.readUint32(entry + ENTRY_FIELDS.next);
      if(this.readUint32(entry + ENTRY_FIELDS.state) === LIVE && this.stale(entry)){
        this.unlinkHash(entry);
        this.retire(entry);
      }
      entry = next;
    }
  }

  private payload(entry: number): Uint8Array {
    const offset = this.readUint32(entry + ENTRY_FIELDS.offset);
    const length = this.readUint32(entry + ENTRY_FIELDS.length);
    const allocatedCapacity = this.readUint32(entry + ENTRY_FIELDS.capacity);
    if(length > allocatedCapacity || offset + allocatedCapacity > this.data.byteLength){
      throw new RangeError("Invalid shared payload bounds");
    }
    return new Uint8Array(this.data, offset, length);
  }

  private payloadEquals(entry: number, data: Uint8Array): boolean {
    const payload = this.payload(entry);
    return payload.length === data.length && Buffer.from(payload.buffer, payload.byteOffset, payload.length).equals(data);
  }

  private publish(entry: number): void {
    if(this.readUint32(entry + ENTRY_FIELDS.state) !== WRITING){
      throw new Error("Entry is not writable");
    }
    if(this.stale(entry)){
      throw new Error("Cannot publish a stale cache entry");
    }
    // linking may grow the hash table, evict, or fail, so the previous entry is only looked up afterwards
    this.linkHash(entry);
    this.writeUint32(entry + ENTRY_FIELDS.state, LIVE);
    const previous = this.findStored(
      this.readUint32(entry + ENTRY_FIELDS.hash),
      KEY,
      entry + ENTRY_FIELDS.key,
      this.readUint32(entry + ENTRY_FIELDS.keyLength),
      this.readUint32(entry + ENTRY_FIELDS.hashNext)
    );
    if(previous){
      this.unlinkHash(previous);
      this.retire(previous);
    }
  }

  private retire(entry: number): void {
    this.writeUint32(entry + ENTRY_FIELDS.state, RETIRED);
    if(!this.readUint32(entry + ENTRY_FIELDS.readers)){
      this.release(entry);
    }
  }

  private release(entry: number): void {
    this.unlinkEntry(entry);
    this.freeDependencies(this.readUint32(entry + ENTRY_FIELDS.dependencies));
    this.writeUint32(entry + ENTRY_FIELDS.dependencies, 0);
    this.writeUint32(entry + ENTRY_FIELDS.state, FREE);
    if(this.readUint32(entry + ENTRY_FIELDS.capacity)){
      this.freeDataExtent(entry);
    } else {
      this.freeMetadata(entry);
    }
  }

  // the active entry list is ordered from the most to the least recently used entry
  private linkEntry(entry: number): void {
    const head = this.readUint32(HEADER_FIELDS.entries);
    this.writeUint32(entry + ENTRY_FIELDS.previous, 0);
    this.writeUint32(entry + ENTRY_FIELDS.next, head);
    this.writeUint32(head ? head + ENTRY_FIELDS.previous : HEADER_FIELDS.tail, entry);
    this.writeUint32(HEADER_FIELDS.entries, entry);
  }

  private unlinkEntry(entry: number): void {
    const previousEntry = this.readUint32(entry + ENTRY_FIELDS.previous);
    const nextEntry = this.readUint32(entry + ENTRY_FIELDS.next);
    this.writeUint32(previousEntry ? previousEntry + ENTRY_FIELDS.next : HEADER_FIELDS.entries, nextEntry);
    this.writeUint32(nextEntry ? nextEntry + ENTRY_FIELDS.previous : HEADER_FIELDS.tail, previousEntry);
  }

  private touch(entry: number): void {
    if(this.readUint32(HEADER_FIELDS.entries) !== entry){
      this.unlinkEntry(entry);
      this.linkEntry(entry);
    }
  }

  private freeDataExtent(entry: number): void {
    const offset = this.readUint32(entry + ENTRY_FIELDS.offset);
    let previous = 0;
    let previousLink = HEADER_FIELDS.dataFree;
    let next = this.readUint32(HEADER_FIELDS.dataFree);
    while(next && this.readUint32(next + ENTRY_FIELDS.offset) < offset){
      previousLink = previous ? previous + ENTRY_FIELDS.next : HEADER_FIELDS.dataFree;
      previous = next;
      next = this.readUint32(next + ENTRY_FIELDS.next);
    }
    this.writeUint32(entry + ENTRY_FIELDS.next, next);
    this.writeUint32(previous ? previous + ENTRY_FIELDS.next : HEADER_FIELDS.dataFree, entry);
    if(next && offset + this.readUint32(entry + ENTRY_FIELDS.capacity) === this.readUint32(next + ENTRY_FIELDS.offset)){
      this.writeUint32(entry + ENTRY_FIELDS.capacity, this.readUint32(entry + ENTRY_FIELDS.capacity) + this.readUint32(next + ENTRY_FIELDS.capacity));
      this.writeUint32(entry + ENTRY_FIELDS.next, this.readUint32(next + ENTRY_FIELDS.next));
      this.freeMetadata(next);
    }
    let extent = entry;
    let extentLink = previous ? previous + ENTRY_FIELDS.next : HEADER_FIELDS.dataFree;
    if(previous && this.readUint32(previous + ENTRY_FIELDS.offset) + this.readUint32(previous + ENTRY_FIELDS.capacity) === offset){
      this.writeUint32(previous + ENTRY_FIELDS.capacity, this.readUint32(previous + ENTRY_FIELDS.capacity) + this.readUint32(entry + ENTRY_FIELDS.capacity));
      this.writeUint32(previous + ENTRY_FIELDS.next, this.readUint32(entry + ENTRY_FIELDS.next));
      this.freeMetadata(entry);
      extent = previous;
      extentLink = previousLink;
    }
    if(this.readUint32(extent + ENTRY_FIELDS.offset) + this.readUint32(extent + ENTRY_FIELDS.capacity) === this.readUint32(HEADER_FIELDS.dataEnd)){
      this.writeUint32(HEADER_FIELDS.dataEnd, this.readUint32(extent + ENTRY_FIELDS.offset));
      this.writeUint32(extentLink, this.readUint32(extent + ENTRY_FIELDS.next));
      this.freeMetadata(extent);
    }
  }
}
