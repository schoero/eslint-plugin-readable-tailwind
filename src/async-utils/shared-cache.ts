import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { Readable, Writable } from "node:stream";


export interface CacheOptions {
  initialDataCapacity: number;
  initialMetadataCapacity: number;
  maxDataCapacity: number;
  maxMetadataCapacity: number;
}

export interface CacheReadOptions {
  tags?: readonly string[];
}

export interface CacheEntryOptions extends CacheReadOptions {
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

const HEADER = 48;
const MAGIC = 0x53_54_41_43;
const LIMIT = 0x7F_FF_FF_F8;
const RECORD_SIZE = 72;
const INITIAL_BUCKETS = 16;
const STREAM_CHUNK_SIZE = 64 * 1024;

const HEADER_FIELDS = {
  bucketCount: 20,
  buckets: 16,
  clock: 40,
  dataEnd: 32,
  dataFree: 36,
  end: 8,
  entries: 28,
  free: 12,
  magic: 0,
  names: 24
};
const ENTRY_FIELDS = {
  capacity: 16,
  createdAt: 40,
  invalid: 64,
  key: 4,
  length: 12,
  next: 0,
  observed: 32,
  offset: 8,
  path: 28,
  pathNext: 56,
  pathPrevious: 60,
  previous: 52,
  readers: 24,
  state: 20,
  tags: 48
};
const NAME_FIELDS = {
  hash: 4,
  kind: 8,
  length: 12,
  next: 0,
  target: 16,
  text: 32,
  timestamp: 24
};
const WRITING = 1;
const LIVE = 2;
const RETIRED = 3;
const FREE = 4;
const KEY = 1;
const TAG = 2;
const PATH = 3;

function align(value: number): number {
  return Math.ceil(value / 8) * 8;
}

function validateCapacity(value: number, name: string): void {
  if(!Number.isSafeInteger(value) || value < 0 || value > LIMIT){
    throw new RangeError(`${name} must be an integer between 0 and ${LIMIT}`);
  }
}

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
      throw new RangeError("Invalid initial or maximum buffer capacity (metadata requires at least 120 bytes)");
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

  get(key: string, options: CacheReadOptions = {}): Uint8Array | undefined {
    const entry = this.current(key);
    if(entry && !this.stale(entry, options.tags)){
      return this.payload(entry).slice();
    }
  }

  has(key: string, options: CacheReadOptions = {}): boolean {
    const entry = this.current(key);
    return !!entry && !this.stale(entry, options.tags);
  }

  set(key: string, data: Uint8Array, options: CacheEntryOptions = {}): void {
    const entry = this.reserve(key, data.byteLength, options);
    try {
      this.payload(entry).set(data);
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
    const entry = this.current(key);
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
    const entry = this.current(key);
    if(!entry){
      return false;
    }
    this.writeUint32(this.readUint32(entry + ENTRY_FIELDS.key) + NAME_FIELDS.target, 0);
    this.retire(entry);
    return true;
  }

  addTags(key: string, tags: readonly string[]): void {
    const entry = this.current(key);
    if(!entry){
      return;
    }
    const associations = this.makeTags(tags);
    if(associations){
      let tail = associations;
      while(this.readUint32(tail)){
        tail = this.readUint32(tail);
      }
      this.writeUint32(tail, this.readUint32(entry + ENTRY_FIELDS.tags));
      this.writeUint32(entry + ENTRY_FIELDS.tags, associations);
    }
  }

  invalidateTag(tag: string): void {
    const timestamp = this.nextTimestamp();
    this.metadataView.setFloat64(this.name(tag, TAG, true) + NAME_FIELDS.timestamp, timestamp, true);
  }

  clear(): void {
    let entry = this.readUint32(HEADER_FIELDS.entries);
    while(entry){
      const next = this.readUint32(entry + ENTRY_FIELDS.next);
      const state = this.readUint32(entry + ENTRY_FIELDS.state);
      if(state === WRITING){
        this.writeUint32(entry + ENTRY_FIELDS.invalid, 1);
      } else if(state === LIVE){
        this.writeUint32(this.readUint32(entry + ENTRY_FIELDS.key) + NAME_FIELDS.target, 0);
        this.retire(entry);
      }
      entry = next;
    }
  }

  isTagValid(tag: string, key: string): boolean {
    const entry = this.current(key);
    if(!entry){
      return false;
    }
    const record = this.name(tag, TAG, false);
    return !record || this.metadataView.getFloat64(record + NAME_FIELDS.timestamp, true) <=
      this.metadataView.getFloat64(entry + ENTRY_FIELDS.createdAt, true);
  }

  recordPathUpdate(path: string, timestamp = Date.now()): void {
    if(!Number.isFinite(timestamp)){
      throw new RangeError("Path timestamp must be finite");
    }
    this.updatePath(this.name(path, PATH, true), timestamp);
  }

  getPathLastModified(path: string): number | undefined {
    const record = this.name(path, PATH, false);
    return record ? this.metadataView.getFloat64(record + NAME_FIELDS.timestamp, true) : undefined;
  }

  invalidatePath(path: string): void {
    const record = this.name(path, PATH, true);
    const previous = this.metadataView.getFloat64(record + NAME_FIELDS.timestamp, true);
    let timestamp = Math.max(Date.now(), previous + 1);
    if(timestamp === previous){
      timestamp = previous === 0 ? 1 : -previous;
    }
    this.updatePath(record, timestamp);
  }

  isStale(key: string): boolean {
    const entry = this.current(key);
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
      if(this.readUint32(entry + ENTRY_FIELDS.state) === WRITING){
        stats.writingEntries++;
      } else if(this.readUint32(entry + ENTRY_FIELDS.state) === LIVE){
        if(this.stale(entry)){
          stats.staleEntries++;
        } else {
          stats.entries++;
          const keyRecord = this.readUint32(entry + ENTRY_FIELDS.key);
          const keyLength = this.readUint32(keyRecord + NAME_FIELDS.length);
          const key = Buffer.from(this.metadataBytes.subarray(keyRecord + NAME_FIELDS.text, keyRecord + NAME_FIELDS.text + keyLength)).toString("utf16le");
          stats.keys.push(key);
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

  private nextTimestamp(): number {
    const timestamp = this.metadataView.getFloat64(HEADER_FIELDS.clock, true) + 1;
    if(!Number.isSafeInteger(timestamp)){
      throw new RangeError("SharedCache logical clock exhausted");
    }
    this.metadataView.setFloat64(HEADER_FIELDS.clock, timestamp, true);
    return timestamp;
  }

  private grow(buffer: SharedArrayBuffer, required: number): void {
    if(required > buffer.maxByteLength){
      throw new RangeError("SharedCache capacity exhausted");
    }
    buffer.grow(Math.min(buffer.maxByteLength, Math.max(required, buffer.byteLength * 2, 8)));
  }

  private allocateMetadata(size: number): number {
    const total = align(size + 8);
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
    const block = this.readUint32(HEADER_FIELDS.end);
    if(block + total > this.metadata.byteLength){
      this.grow(this.metadata, block + total);
    }
    this.writeUint32(block, total);
    this.writeUint32(HEADER_FIELDS.end, block + total);
    this.metadataBytes.fill(0, block + 8, block + total);
    return block + 8;
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

  private name(text: string, kind: number, create: boolean): number {
    const encoded = Buffer.from(text, "utf16le");
    let hash = kind;
    for(const byte of encoded){
      hash = Math.imul(hash ^ byte, 16_777_619) >>> 0;
    }
    let bucket = this.readUint32(HEADER_FIELDS.buckets) + hash % this.readUint32(HEADER_FIELDS.bucketCount) * 4;
    for(let record = this.readUint32(bucket); record; record = this.readUint32(record + NAME_FIELDS.next)){
      if(this.readUint32(record + NAME_FIELDS.hash) === hash && this.readUint32(record + NAME_FIELDS.kind) === kind &&
        this.readUint32(record + NAME_FIELDS.length) === encoded.length &&
        encoded.every((byte, index) => byte === this.metadataBytes[record + NAME_FIELDS.text + index])){
        return record;
      }
    }
    if(!create){
      return 0;
    }
    if(this.readUint32(HEADER_FIELDS.names) >= this.readUint32(HEADER_FIELDS.bucketCount) * 2){
      this.rehash();
      bucket = this.readUint32(HEADER_FIELDS.buckets) + hash % this.readUint32(HEADER_FIELDS.bucketCount) * 4;
    }
    const record = this.allocateMetadata(NAME_FIELDS.text + encoded.length);
    this.writeUint32(record + NAME_FIELDS.next, this.readUint32(bucket));
    this.writeUint32(record + NAME_FIELDS.hash, hash);
    this.writeUint32(record + NAME_FIELDS.kind, kind);
    this.writeUint32(record + NAME_FIELDS.length, encoded.length);
    this.metadataBytes.set(encoded, record + NAME_FIELDS.text);
    this.writeUint32(bucket, record);
    this.writeUint32(HEADER_FIELDS.names, this.readUint32(HEADER_FIELDS.names) + 1);
    return record;
  }

  private rehash(): void {
    const old = this.readUint32(HEADER_FIELDS.buckets);
    const count = this.readUint32(HEADER_FIELDS.bucketCount);
    const replacement = this.allocateMetadata(count * 8);
    for(let index = 0; index < count; index++){
      let record = this.readUint32(old + index * 4);
      while(record){
        const next = this.readUint32(record + NAME_FIELDS.next);
        const bucket = replacement + this.readUint32(record + NAME_FIELDS.hash) % (count * 2) * 4;
        this.writeUint32(record + NAME_FIELDS.next, this.readUint32(bucket));
        this.writeUint32(bucket, record);
        record = next;
      }
    }
    this.writeUint32(HEADER_FIELDS.buckets, replacement);
    this.writeUint32(HEADER_FIELDS.bucketCount, count * 2);
    this.freeMetadata(old);
  }

  private current(key: string): number {
    const record = this.name(key, KEY, false);
    return record ? this.readUint32(record + NAME_FIELDS.target) : 0;
  }

  private makeTags(tags: readonly string[]): number {
    let head = 0;
    try {
      for(const tag of new Set(tags)){
        const record = this.name(tag, TAG, true);
        const association = this.allocateMetadata(8);
        this.writeUint32(association, head);
        this.writeUint32(association + 4, record);
        head = association;
      }
      return head;
    } catch (error){
      this.freeTags(head);
      throw error;
    }
  }

  private freeTags(head: number): void {
    while(head){
      const next = this.readUint32(head);
      this.freeMetadata(head);
      head = next;
    }
  }

  private stale(entry: number, tags: readonly string[] = []): boolean {
    if(this.readUint32(entry + ENTRY_FIELDS.invalid)){
      return true;
    }
    const path = this.readUint32(entry + ENTRY_FIELDS.path);
    if(path && this.metadataView.getFloat64(path + NAME_FIELDS.timestamp, true) !== this.metadataView.getFloat64(entry + ENTRY_FIELDS.observed, true)){
      return true;
    }
    const createdAt = this.metadataView.getFloat64(entry + ENTRY_FIELDS.createdAt, true);
    for(let tag = this.readUint32(entry + ENTRY_FIELDS.tags); tag; tag = this.readUint32(tag)){
      const record = this.readUint32(tag + 4);
      if(this.metadataView.getFloat64(record + NAME_FIELDS.timestamp, true) > createdAt){
        return true;
      }
    }
    return tags.some(tag => {
      const record = this.name(tag, TAG, false);
      return !!record && this.metadataView.getFloat64(record + NAME_FIELDS.timestamp, true) > createdAt;
    });
  }

  private updatePath(path: number, timestamp: number): void {
    if(this.metadataView.getFloat64(path + NAME_FIELDS.timestamp, true) !== timestamp){
      this.metadataView.setFloat64(path + NAME_FIELDS.timestamp, timestamp, true);
      for(let entry = this.readUint32(path + NAME_FIELDS.target); entry; entry = this.readUint32(entry + ENTRY_FIELDS.pathNext)){
        this.writeUint32(entry + ENTRY_FIELDS.invalid, 1);
      }
    }
  }

  private reserve(key: string, length: number, options: CacheEntryOptions): number {
    validateCapacity(length, "Payload length");
    const createdAt = this.nextTimestamp();
    const keyRecord = this.name(key, KEY, true);
    const path = options.path === undefined ? 0 : this.name(options.path, PATH, true);
    const tags = this.makeTags(options.tags ?? []);
    let entry = 0;
    try {
      entry = this.allocateMetadata(RECORD_SIZE);
      const offset = this.allocateData(length);
      this.writeUint32(entry + ENTRY_FIELDS.key, keyRecord);
      this.writeUint32(entry + ENTRY_FIELDS.offset, offset);
      this.writeUint32(entry + ENTRY_FIELDS.length, length);
      this.writeUint32(entry + ENTRY_FIELDS.capacity, length);
      this.writeUint32(entry + ENTRY_FIELDS.state, WRITING);
      this.writeUint32(entry + ENTRY_FIELDS.path, path);
      this.writeUint32(entry + ENTRY_FIELDS.tags, tags);
      this.metadataView.setFloat64(entry + ENTRY_FIELDS.createdAt, createdAt, true);
      this.metadataView.setFloat64(entry + ENTRY_FIELDS.observed, path ? this.metadataView.getFloat64(path + NAME_FIELDS.timestamp, true) : 0, true);
      this.linkEntry(entry);
      return entry;
    } catch (error){
      this.freeTags(tags);
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
    let offset = this.allocateFreeExtent(length);
    if(offset !== undefined){
      return offset;
    }
    if(this.readUint32(HEADER_FIELDS.dataEnd) + length > this.data.byteLength){
      this.reclaimStale();
      offset = this.allocateFreeExtent(length);
      if(offset !== undefined){
        return offset;
      }
    }
    offset = this.readUint32(HEADER_FIELDS.dataEnd);
    if(offset + length > this.data.byteLength){
      this.grow(this.data, offset + length);
    }
    this.writeUint32(HEADER_FIELDS.dataEnd, offset + length);
    return offset;
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
        const key = this.readUint32(entry + ENTRY_FIELDS.key);
        if(this.readUint32(key + NAME_FIELDS.target) === entry){
          this.writeUint32(key + NAME_FIELDS.target, 0);
        }
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

  private publish(entry: number): void {
    if(this.readUint32(entry + ENTRY_FIELDS.state) !== WRITING){
      throw new Error("Entry is not writable");
    }
    if(this.stale(entry)){
      throw new Error("Cannot publish a stale cache entry");
    }
    const key = this.readUint32(entry + ENTRY_FIELDS.key);
    const previous = this.readUint32(key + NAME_FIELDS.target);
    this.writeUint32(entry + ENTRY_FIELDS.state, LIVE);
    this.writeUint32(key + NAME_FIELDS.target, entry);
    if(previous){
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
    this.freeTags(this.readUint32(entry + ENTRY_FIELDS.tags));
    this.writeUint32(entry + ENTRY_FIELDS.state, FREE);
    if(this.readUint32(entry + ENTRY_FIELDS.capacity)){
      this.freeDataExtent(entry);
    } else {
      this.freeMetadata(entry);
    }
  }

  private linkEntry(entry: number): void {
    const head = this.readUint32(HEADER_FIELDS.entries);
    this.writeUint32(entry + ENTRY_FIELDS.next, head);
    if(head){
      this.writeUint32(head + ENTRY_FIELDS.previous, entry);
    }
    this.writeUint32(HEADER_FIELDS.entries, entry);

    const path = this.readUint32(entry + ENTRY_FIELDS.path);
    if(path){
      const pathHead = this.readUint32(path + NAME_FIELDS.target);
      this.writeUint32(entry + ENTRY_FIELDS.pathNext, pathHead);
      if(pathHead){
        this.writeUint32(pathHead + ENTRY_FIELDS.pathPrevious, entry);
      }
      this.writeUint32(path + NAME_FIELDS.target, entry);
    }
  }

  private unlinkEntry(entry: number): void {
    const previousEntry = this.readUint32(entry + ENTRY_FIELDS.previous);
    const nextEntry = this.readUint32(entry + ENTRY_FIELDS.next);
    this.writeUint32(previousEntry ? previousEntry + ENTRY_FIELDS.next : HEADER_FIELDS.entries, nextEntry);
    if(nextEntry){
      this.writeUint32(nextEntry + ENTRY_FIELDS.previous, previousEntry);
    }
    const path = this.readUint32(entry + ENTRY_FIELDS.path);
    if(path){
      const previous = this.readUint32(entry + ENTRY_FIELDS.pathPrevious);
      const next = this.readUint32(entry + ENTRY_FIELDS.pathNext);
      this.writeUint32(previous ? previous + ENTRY_FIELDS.pathNext : path + NAME_FIELDS.target, next);
      if(next){
        this.writeUint32(next + ENTRY_FIELDS.pathPrevious, previous);
      }
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
