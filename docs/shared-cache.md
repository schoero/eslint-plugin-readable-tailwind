# Shared Binary Cache

<!-- cspell:words Uint backpressure lifecycle -->

Independent TypeScript ESM implementation: [shared-cache.ts](../src/async-utils/shared-cache.ts).
It does not import the project's existing cache or its consumers.
Use a Node.js runtime with growable `SharedArrayBuffer` support; unsupported
runtimes throw explicitly. Compile with TypeScript's `ESNext` library and Node.js
types. No runtime dependencies are needed.

The cache has a single owner: only one execution context may access it at a
time. There are no locks, atomic operations, or concurrent-worker guarantees.
The buffers remain shareable for sequential worker handoff, and metadata remains
the authoritative source of truth. Overlapping streams within the owning worker
are supported.

## Usage

```ts
import { createReadStream, createWriteStream, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Worker } from "node:worker_threads";

import { SharedCache } from "./src/async-utils/shared-cache.js";

const cache = SharedCache.create({
  initialDataCapacity: 1024 * 1024,
  initialMetadataCapacity: 4096,
  maxDataCapacity: 256 * 1024 * 1024,
  maxMetadataCapacity: 16 * 1024 * 1024
});

cache.recordPathUpdate("/input.bin", statSync("/input.bin").mtimeMs);
cache.set("question", new TextEncoder().encode("?"));
cache.set("answer", new TextEncoder().encode("42"), {
  dependencies: [{ key: "question", version: cache.version("question")! }]
});
const copy = cache.get("answer");
cache.set("question", new TextEncoder().encode("!"));
console.log(cache.has("answer")); // false

await pipeline(
  createReadStream("/input.bin"),
  cache.createWriteStream("file", statSync("/input.bin").size, { path: "/input.bin" })
);
await pipeline(cache.createReadStream("file"), createWriteStream("/output.bin"));

// Alternatively, synchronous file ingestion uses reads of at most 64 KiB.
cache.setFile("file-copy", "/input.bin", { path: "/input.bin" });

new Worker(new URL("./worker.js", import.meta.url), {
  workerData: { data: cache.data, metadata: cache.metadata }
});
```

After handing the buffers to the worker, stop accessing the cache in the parent
until the worker exits or explicitly returns ownership. In the ESM worker:

```ts
import { workerData } from "node:worker_threads";

import { SharedCache } from "./src/async-utils/shared-cache.js";

const cache = SharedCache.attach(workerData.metadata, workerData.data);
cache.set("worker-result", new Uint8Array([1, 2, 3]));
```

The core API is entirely synchronous. Only the normal stream lifecycle is
event-driven. Write streams reserve their complete expected length immediately;
creation can throw on capacity exhaustion. Missing or stale read-stream keys
throw synchronously. `get()` returns `undefined` for missing or stale entries
and otherwise returns an independent copy.

## File And Value Wrapper

[CachedStore](../src/async-utils/cached-store.ts) adds synchronous JavaScript
values and read-through files without changing the binary payload API:

```ts
import { CachedStore } from "./src/async-utils/cached-store.js";

CachedStore.upsert("input", 42);
CachedStore.upsert("result", { count: 42, updated: new Date() }, { dependencies: ["input"], paths: ["./input.bin"] });
const result = CachedStore.get<{ count: number; updated: Date; }>("result");
const file = CachedStore.readFile("./input.bin");

CachedStore.upsert("input", 43);
CachedStore.get("result"); // undefined

CachedStore.has("result");
CachedStore.hasFile("./input.bin");
CachedStore.delete("result");
CachedStore.deleteFile("./input.bin");
CachedStore.clear();
```

All methods are static; there is no public constructor or `shared` getter.
The backing buffers are initialized lazily. Their maximum is 32 MB by default, a
quarter for metadata and the rest for payloads, and can be changed with
`setCapacity()` before they are created. The plugin calls it with the `cacheSize`
setting. The first capacity applies, a later one only if it is larger, which
replaces the buffers. To supply custom capacities, create
a `SharedCache` and call `CachedStore.attachSharedState()` with its `data` and
`metadata` buffers before using the static methods.

`get<Value>()` and `upsert()` use `node:v8` serialization only in this wrapper.
Supported values include dates, maps, sets, binary values, BigInt, and cyclic
objects. Functions and other unsupported values throw before replacing an entry.
Every read deserializes an independent value from a copy of the payload, because
deserialized typed arrays would otherwise share memory with the cache. Payloads
are the V8 header, a 32-bit flag that marks values created by an asynchronous
callback, and the value. Keys are `value:` followed by the JSON of the key; the
shared cache hashes and compares them itself. JSON longer than 64 characters, for
example of large class lists, is replaced by `#` and the first 128 bits of its
SHA-256 hash, which keeps the stored keys and their comparisons small. The generic type is a caller's
assertion, not runtime validation. Stored `undefined` and cache misses both
return `undefined`; use `has()` to distinguish them.

`readFile()` checks the filesystem modification timestamp on every call. A miss
loads the file through the binary cache's bounded `setFile()` reads. It returns
a UTF-8 string containing the complete file, so the returned result necessarily
consumes memory proportional to file size. Decoding uses `TextDecoder`: malformed
UTF-8 is replaced and a leading UTF-8 BOM is omitted. The underlying binary cache
continues to store the original bytes. There is no disk-writing
method. `hasFile()` checks freshness without loading the payload, and
`deleteFile()` only deletes the cached entry, never the file on disk.

Relative file paths resolve against the current working directory. File paths
and value keys have separate namespaces. Missing files never return cached
bytes; `readFile()` propagates the filesystem error and `hasFile()` returns
false for missing paths. Other filesystem errors and capacity errors propagate.
Timestamp changes invalidate the cached file, including changes to older dates.
Content edits that preserve the timestamp may go undetected. Loading checks
timestamp and size before and after ingestion, retries once on a detected
change, and throws if the file changes again. This is not a filesystem snapshot.

`dependencies` and `paths` supplied to `upsert()` or `getOrCreate()` become stored
dependencies. They are snapshotted before the value is created: the version of
each dependency entry and of each file's path entry. An entry is valid while every
dependency entry is itself valid and still has the recorded version, and every
path entry still has the recorded version. Validation is transitive,
so entries derived from an entry that is derived from a changed file are stale as
well. A value is not stored when a dependency is missing or changed while the
value was created.

Reading an entry with `get()`, `has()` or `getOrCreate()`, or calling
`refreshPaths()`, stats the files the entry depends on directly. Entries that only
depend on it transitively compare recorded versions and never access the file
system. Missing files are recorded as missing and stay valid while they are
missing.

`clear()` clears the entire injected binary cache, including entries outside
the wrapper. It preserves buffer identity, capacities, and existing attachments.
Path entries are cleared as well and all metadata is freed. Active read streams may
finish their snapshots; pre-clear write streams cannot publish afterward.
`getStats()` forwards the binary cache statistics. Binary views over attached buffers
observe the same state and retain the single-owner restriction.

### Shared Integration

`CachedStore` provides static access to lazily initialized shared buffers.
Production callers use it instead of the legacy shared `Cache`.
`getOrCreate(key, callback, { dependencies, paths })` memoizes computed values,
including `undefined`. Keys may be strings, numbers, booleans, or arrays of those
values; undefined array members are omitted. `getOrCreate()`, `get()` and
`upsert()` share one namespace, so any entry can be a dependency of another.
Shared entries that others depend on are listed in the `CacheEntry` enum.

`getOrCreateEach(keys, callback, { dependencies, paths })` does the same for many
keys at once. The callback is called once with the indexes of the missing keys
and returns their values in the same order; every value is stored as its own
entry against one dependency snapshot taken before the callback. Unknown classes
use it per class, so editing a class list only computes the classes that are new.

Inputs such as the cwd or an option are plain entries written with `upsert()` on
every call. Writing an identical value is a no-op, so only actual changes
invalidate their dependents. A primitive that the same thread wrote before is not
even serialized again while its entry keeps the same version. When a stale entry is recomputed to an identical
value, it keeps its previous version, so entries derived from it stay valid.

```ts
import { CachedStore, CacheEntry } from "./src/async-utils/cached-store.js";

CachedStore.upsert(CacheEntry.CWD, process.cwd());

const settings = CachedStore.getOrCreate(
  "settings",
  () => JSON.parse(CachedStore.readFile("./settings.json")),
  { dependencies: [CacheEntry.CWD], paths: ["./settings.json"] }
);

const state = CachedStore.getSharedState();
```

The callback may return a promise; only resolved values are serialized, and
rejections are not cached. The binary cache operations remain synchronous.
Dependencies are stored in the shared metadata, so the host and the worker
validate entries written by each other without calling each other. An entry
written by the other side while the value was created is not written again.

Pass `state` to the synchronous worker call, and call
`CachedStore.attachSharedState(state)` before handling the request in that worker.
The state contains only the existing metadata and data buffers. Attachment never
resets them. The caller must remain idle until the worker returns, preserving
single-owner access.

Non-serializable resolvers and Tailwind contexts live in top-level module
variables, not an isolated map. A dummy `true` entry is stored in `CachedStore`
with the appropriate dependencies. The object is reused only while that entry
passes `has()`. A failed check triggers local reconstruction; the dummy entry and
local object are updated only after successful construction. The Tailwind context
entry is deleted before it is rebuilt, so everything derived from the previous
context becomes stale even if the new entry has the same value. Attaching different
buffers resets local objects. `getSharedState()` returns a stable state
object until the attached buffers change, allowing those objects to detect a
handoff. Repeated attachment of the identical buffer objects preserves that
identity. The underlying shared buffers are never reset by attachment.

The objects themselves are never serialized. CSS source text is cached instead
of CSS-tree AST instances, which must be parsed locally to preserve their methods.

## Binary Layout

Exactly two growable shared buffers are created. All integers are little-endian
unsigned 32-bit values. Filesystem timestamps and logical timestamps are
little-endian float64 values.
Offsets use zero as a null reference. The maximum supported buffer size is
2,147,483,640 bytes. The metadata initial capacity must be at least 128 bytes.

### Metadata Buffer

The fixed 56-byte header contains:

| Byte Offset | Field |
| --- | --- |
| 0 | Initialization marker, not a format version |
| 4 | Reset request flag set by `requestReset()` |
| 8 | Metadata arena high-water offset |
| 12 | Sorted metadata free-block list head |
| 16, 20 | Hash bucket table offset and bucket count |
| 24 | Number of entries in the hash table |
| 28 | Active allocation list head |
| 32 | Data allocation frontier |
| 36 | Sorted data free-extent list head |
| 40 | Shared logical clock |
| 48 | Least recently used active entry |

The initialization marker identifies this layout. Buffers initialized by the
older boolean-tag layout cannot be attached; create a fresh cache when upgrading.

All arena blocks are 8-byte aligned and begin with an 8-byte allocation header:
total block size, then free-list next offset. That header precedes the offsets
stored in records. Freed metadata blocks split and coalesce.

The shared hash table starts with 16 buckets and contains the published entries
directly; there is no separate name registry. Entries chain through their hash
next offset. Buckets double at load factor two, rehash, and release the old bucket
allocation. A lookup hashes the key with FNV-1a over its UTF-16LE code units and
compares hash, kind, length and key bytes. Deleting an entry unlinks it from its
bucket and frees all of its metadata, including its key.

Each entry uses an 88-byte header followed by its key:

| Byte Offset | Field |
| --- | --- |
| 0, 52 | Next and previous active entry offsets, from the most to the least recently used |
| 4 | Next entry in the same hash bucket |
| 8, 12, 16 | Data offset, payload length, reserved capacity |
| 20, 24 | State and reader lease count |
| 28 | Key hash |
| 32 | Recorded modification time, for path entries |
| 40 | Logical write-start timestamp |
| 48 | Dependency list head |
| 56, 60 | Kind (key 1, path 2) and key length in bytes |
| 64 | Persistent invalidation flag |
| 68 | Alignment padding |
| 72 | Version |
| 80 | Logical clock at the last successful validation |
| 88 | Exact UTF-16LE key bytes, preserving lone surrogates |

Paths are entries of their own kind without payload. Their version changes
whenever their recorded modification time changes, so the `path` entry option and
path dependencies both compare versions. An entry created with the `path` option
depends on its path entry.

Dependencies are 24-byte headers followed by the key of the dependency: next
offset, key hash, kind, key length, and the recorded version. They store the key
instead of an offset and look it up again when validated, so they never refer to
freed records. The version of an entry is its logical write-start timestamp, or the
version of the entry it replaced if both have identical payloads. Entry states are
writing (1), live (2), retired (3), and free extent (4). Only live entries are in
the hash table. A released allocation reuses its entry record as a free extent,
using the next, offset, and capacity fields. This avoids allocating metadata
during deletion.

The logical clock increments for every write reservation, path change, and
removal from the hash table, not at publication. A successful validation stores
the current clock in the entry. As long as the clock has not moved, nothing can
have made the entry stale, so later checks only compare one number instead of
walking its dependencies. The clock is independent of wall-clock time, so operations within
one millisecond, clock changes, and sequential worker handoff retain their
ordering. The counter is stored as an exact integer up to
`Number.MAX_SAFE_INTEGER`; exhaustion throws rather than wrapping. Clearing does
not reset it. There are no format versions or JavaScript references in shared
memory.

### Data Buffer

The data buffer contains payload bytes only, without headers or alignment
requirements. Offsets remain stable through both metadata and data growth.
Length-tracking views observe growth automatically, including in attached
workers. Free regions are first-fit, address-ordered, split on allocation, and
coalesced immediately on release. A free region adjoining the unused buffer
tail is returned to the allocation frontier, allowing subsequent allocations
to consume it without growth or extend it during growth.

Before data growth, the allocator scans live entries for stale paths or dependencies,
retires them, frees unpinned allocations, and retries the coalesced free list.
Only then does it grow geometrically, bounded by the configured maximum.

### Eviction

The active entry list doubles as the least recently used order. Publishing an
entry, reading a valid entry with `get()`, `has()` or `version()`, and writing a
payload identical to the current valid entry move it to the front. When an
allocation would grow the metadata or data buffer beyond its maximum, stale
entries are reclaimed first, then the least recently used entries are evicted one
at a time until the allocation fits. Entries that are being written, entries
pinned by read streams or by a refresh in progress, and path entries are never
evicted. Evicting an entry advances the logical clock, so entries that depend on
it become stale. A write whose dependency was evicted while making room for it
is not published. A single allocation that can never fit throws without
evicting anything.

## Consistency

- All cache operations execute synchronously within one owning execution context.
  There is no synchronization or waiting. Other threads must not access the
  buffers while that context owns them. A synchronous `get` returns a copy.
- Writers reserve distinct allocations. The previous entry remains readable until
  successful publication. The last successful publication wins on the same key,
  even if a delete occurred after that writer reserved its allocation.
- Failed, destroyed, short, oversized, or invalidated writes release reservations
  without replacing the previous entry. A reservation whose dependencies or path
  become stale cannot publish.
- Read streams acquire snapshot leases. Already-open streams may finish their
  snapshot after deletion, replacement, or invalidation. New readers cannot open
  stale entries. Retired allocations are reusable only after the final lease ends.
- Read streams emit independent chunks of at most 64 KiB and honor backpressure.
  Chunk copies allow consumers to retain emitted bytes after the lease ends.
  Write streams copy incoming chunks directly into their reserved allocation.
- An entry is stale if a dependency entry is missing, stale, or has a different
  version than recorded, or if a path dependency has a different recorded
  modification time. Changing an entry does not scan its dependents; they are
  checked when they are read. Validation is limited to a depth of 32.
- `set()` does not write a payload identical to the current valid entry. Replacing
  a stale entry with an identical payload keeps its version.
- Paths begin at timestamp zero when first associated through the `path` option;
  supplying the same timestamp does not invalidate entries. A changed timestamp
  changes the path's version, so dependents stay stale even if a previous
  timestamp is restored. `invalidatePath` always changes the timestamp. There is
  no filesystem watcher.
- `clear()` retires current entries and invalidates pending writes without
  replacing the buffers. Pinned retired allocations remain reserved until their
  read streams end. Pending writes release their reservations when finished or
  destroyed and fail publication after clearing.

## Complexity And Limits

Key and path lookups are expected constant time plus key length. Clearing
scans the active entries and releases storage through the normal free lists.
Read validity checks are constant time while the clock has not moved since the
last validation, otherwise linear in the number of transitive dependencies.
Path updates change one path entry without visiting its dependents. Allocation/free-list work is linear in the number
of free extents, without sorting. Metadata free-list operations are also linear
in their free-block count. Rehashing is amortized; pressure reclamation visits
active entries and their dependencies, with additional free-list work per released entry.
`get` copies the payload; streaming uses bounded adapter memory independent of
payload length. `setFile` reads directly into the shared allocation in bounded
chunks but cannot guarantee a coherent snapshot of a concurrently edited file.

`getStats()` scans active allocations and free extents. `usedBytes` includes
pending writes and retired pinned payloads. `freeBytes` includes the unallocated
tail. `metadataUsedBytes` is the arena high-water offset, including reusable
holes. Deleted and evicted entries free all of their metadata, so both buffers
stay within their maximum capacity. Exceeding a maximum capacity because nothing
can be evicted throws `SharedCacheCapacityError`, a `RangeError`.

`CachedStore` does not let that fail its callers. The thread that created
the buffers discards them and starts over with fresh buffers, which attached
threads receive with their next call. An attached thread cannot replace buffers
it does not own: it skips caching the value and calls `requestReset()`, so the
owner replaces the buffers on its next access. `readFile()` then reads the file
directly instead of caching it.

There is no compaction, shrinking, concurrent access support, or crash recovery. Fragmentation can prevent an allocation despite sufficient
total free bytes. A worker terminated with a reservation or lease can leak it.
Always finish or destroy streams before transferring ownership or terminating
workers. An abandoned, unconsumed readable retains its lease. Buffers are trusted
in-process capabilities: do not mutate their metadata directly, attach
mismatched buffers, or access them simultaneously from multiple threads.

## Tests

```sh
NODE_OPTIONS='' npm run test -- --run tests/unit/shared-cache.test.ts tests/unit/cached-store.test.ts tests/unit/context-invalidation.test.ts
```

Coverage includes shared attachment, hash chaining and rehashing, growth,
invalidation, free-region reuse, fragmentation, coalescing, failed replacements,
snapshot pinning, cancellation, upstream/downstream failures, bounded file
streaming with backpressure, overlapping reader leases, and sequential
single-worker handoff with allocation-overlap checks. The wrapper suite covers
V8 value serialization, transitive dependencies, file freshness and changing-file retries,
namespaces, missing files, capacity exhaustion and buffer replacement, and in-place clear.
The context invalidation suite covers host cached results against changes to the
Tailwind config, its imports, the config path, and context rebuilds in the worker.
