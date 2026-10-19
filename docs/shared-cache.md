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
cache.set("answer", new TextEncoder().encode("42"), { tags: ["answers"] });
const copy = cache.get("answer");
cache.addTags("answer", ["session"]);
cache.invalidateTag("session");
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

CachedStore.upsert("result", { count: 42, updated: new Date() }, { tags: ["results"] });
const result = CachedStore.get<{ count: number; updated: Date; }>("result");
const file = CachedStore.readFile("./input.bin", { tags: ["inputs"] });

CachedStore.invalidateTag("results");
CachedStore.upsert("result", { count: 43, updated: new Date() }, { tags: ["results"] });

CachedStore.has("result");
CachedStore.hasFile("./input.bin");
CachedStore.delete("result");
CachedStore.deleteFile("./input.bin");
CachedStore.clear();
```

All methods are static; there is no public constructor or `shared` getter.
The backing buffers are initialized lazily. To supply custom capacities, create
a `SharedCache` and call `CachedStore.attachShared()` with its `data` and
`metadata` buffers before using the static methods.

`get<Value>()` and `upsert()` use `node:v8` serialization only in this wrapper.
Supported values include dates, maps, sets, binary values, BigInt, and cyclic
objects. Functions and other unsupported values throw before replacing an entry.
Every read deserializes an independent value. The generic type is a caller's
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

Tags supplied to `upsert()` or a file cache fill become stored dependencies.
Each entry records when its write started, and each tag records its last
invalidation using a shared logical clock. Tags invalidated after the write
started make that entry stale; fresh writes automatically remain valid without
revalidating tags or reviving older entries. Optional tags on `get()`, `has()`,
`readFile()`, and `hasFile()` are additional validity checks. A cache hit does
not silently add new stored dependencies. A file whose requested tags were
invalidated after its cached write reloads before returning fresh data.

`clear()` clears the entire injected binary cache, including entries outside
the wrapper. It preserves buffer identity, capacities, and existing attachments.
Registry names and path/tag metadata remain allocated. Active read streams may
finish their snapshots; pre-clear write streams cannot publish afterward.
`getStats()` forwards the binary cache statistics. Binary views over attached buffers
observe the same state and retain the single-owner restriction.

### Shared Integration

`CachedStore` provides static access to lazily initialized shared buffers.
Production callers use it instead of the legacy shared `Cache`.
`getOrCreate(key, callback, { paths, tags })` memoizes computed values, including
`undefined`. Keys may be strings, numbers, booleans, or arrays of those values;
undefined array members are omitted. Memoized results use a separate namespace
from direct `get()` and `upsert()` entries. Missing or modified dependency files
cause recomputation, as do invalidated tags.

`isValid(key, { paths, tags })` checks a memoized entry with the same dependency
and tag rules without computing, creating, or refreshing anything. It returns
false for missing entries, changed dependency lists, missing or modified files,
or invalidated tags. Direct `get()`/`upsert()` entries still use `has()`.

```ts
import { CachedStore, CacheTag } from "./src/async-utils/cached-store.js";

const settings = CachedStore.getOrCreate(
  ["settings", "./settings.json"],
  () => JSON.parse(CachedStore.readFile("./settings.json")),
  { paths: ["./settings.json"], tags: [CacheTag.CWD] }
);

const state = CachedStore.toTransferableState();
```

The callback may return a promise; only resolved values are serialized, and
rejections are not cached. The binary cache operations remain synchronous.
Dependency timestamps and memoized values are serialized together, avoiding
process-local authoritative metadata.

Pass `state` to the synchronous worker call, and call
`CachedStore.attachShared(state)` before handling the request in that worker.
The state contains only the existing metadata and data buffers. Attachment never
resets them. The caller must remain idle until the worker returns, preserving
single-owner access.

Non-serializable resolvers and Tailwind contexts live in top-level module
variables, not an isolated map. A dummy `true` entry is memoized in `CachedStore`
with the appropriate path and tag dependencies. The object is reused only while
that entry passes `isValid()`. A failed check triggers local reconstruction;
the dummy entry and local object are updated only after successful construction.
There are no UUID markers or per-object marker comparisons. Attaching different
buffers resets local objects. `toTransferableState()` returns a stable state
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
2,147,483,640 bytes. The metadata initial capacity must be at least 120 bytes.

### Metadata Buffer

The fixed 48-byte header contains:

| Byte Offset | Field |
| --- | --- |
| 0 | Initialization marker, not a format version |
| 4 | Unused space retained to preserve existing buffer offsets |
| 8 | Metadata arena high-water offset |
| 12 | Sorted metadata free-block list head |
| 16, 20 | Hash bucket table offset and bucket count |
| 24 | Registered name count |
| 28 | Active allocation list head |
| 32 | Data allocation frontier |
| 36 | Sorted data free-extent list head |
| 40 | Shared logical clock |

The initialization marker identifies this layout. Buffers initialized by the
older boolean-tag layout cannot be attached; create a fresh cache when upgrading.

All arena blocks are 8-byte aligned and begin with an 8-byte allocation header:
total block size, then free-list next offset. That header precedes the offsets
stored in records. Freed metadata blocks split and coalesce.

The shared hash table starts with 16 buckets. Chained registry records contain
next offset, hash, name kind, encoded name length, and target offset at byte
offsets 0, 4, 8, 12, and 16. Offset 20 is unused padding; offset 24 holds the
timestamp. Exact UTF-16LE name bytes
follow at offset 32, preserving all JavaScript strings, including lone surrogates.
The name kind distinguishes keys, tags, and paths. Targets point to the current
entry for keys and the dependent-entry list for paths. Tags use the timestamp
field for the last logical invalidation; paths use it for filesystem modification
time. Buckets double at load factor two, rehash,
and release the old bucket allocation.

Each entry uses a 72-byte record:

| Byte Offset | Field |
| --- | --- |
| 0, 52 | Next and previous active entry offsets |
| 4 | Key registry record offset |
| 8, 12, 16 | Data offset, payload length, reserved capacity |
| 20, 24 | State and reader lease count |
| 28 | Path registry record offset |
| 32, 40 | Observed path timestamp and logical write-start timestamp |
| 48 | Tag association list head |
| 56, 60 | Next and previous dependent entries for the path |
| 64 | Persistent invalidation flag |
| 68 | Alignment padding |

Tag associations are 8-byte records containing next offset and tag registry
offset. Entry states are writing (1), live (2), retired (3), and free extent (4).
A released allocation reuses its entry record as a free extent, using the next,
offset, and capacity fields. This avoids allocating metadata during deletion.
Path indexes include pending writes and pinned retired entries until release.
The logical clock increments for every write reservation and tag invalidation,
not at publication. It is independent of wall-clock time, so operations within
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

Before data growth, the allocator scans live entries for stale paths or tags,
retires them, frees unpinned allocations, and retries the coalesced free list.
Only then does it grow geometrically, bounded by the configured maximum.
Allocation or metadata exhaustion throws `RangeError`.

## Consistency

- All cache operations execute synchronously within one owning execution context.
  There is no synchronization or waiting. Other threads must not access the
  buffers while that context owns them. A synchronous `get` returns a copy.
- Writers reserve distinct allocations. The previous entry remains readable until
  successful publication. The last successful publication wins on the same key,
  even if a delete occurred after that writer reserved its allocation.
- Failed, destroyed, short, oversized, or invalidated writes release reservations
  without replacing the previous entry. A reservation whose tags or path become
  stale cannot publish.
- Read streams acquire snapshot leases. Already-open streams may finish their
  snapshot after deletion, replacement, or invalidation. New readers cannot open
  stale entries. Retired allocations are reusable only after the final lease ends.
- Read streams emit independent chunks of at most 64 KiB and honor backpressure.
  Chunk copies allow consumers to retain emitted bytes after the lease ends.
  Write streams copy incoming chunks directly into their reserved allocation.
- Unknown tags have an implicit invalidation timestamp of zero. `invalidateTag()`
  advances the clock and updates only the tag registry record; it does not scan
  dependent entries. An entry is stale if any stored tag was invalidated after
  its reservation. New writes with that tag are valid automatically. Pending
  writers retain their original timestamp and cannot publish after invalidation.
- `get(key, { tags })` and `has(key, { tags })` also compare additional read-time
  tags against the entry's reservation timestamp, without storing dependencies.
  `isTagValid(tag, key)` checks that single tag relative to the current entry and
  returns false for missing keys. Adding a tag with `addTags()` does not refresh
  the entry's timestamp. There is no global tag-valid flag or `revalidateTag()`.
- Paths begin at timestamp zero when first associated; supplying the
  same timestamp does not invalidate entries. Changed timestamps mark indexed
  dependents permanently stale, even if a previous timestamp is restored.
  `invalidatePath` always changes the timestamp. There is no filesystem watcher.
- `clear()` retires current entries and invalidates pending writes without
  replacing the buffers. Pinned retired allocations remain reserved until their
  read streams end. Pending writes release their reservations when finished or
  destroyed and fail publication after clearing.

## Complexity And Limits

Key, tag, and path registry lookups are expected constant time plus name length.
Tag invalidation updates one indexed record without scanning entries. Clearing
scans the active entries and releases storage through the normal free lists.
Read validity checks are linear in the entry's tag count. Path updates visit only
that path's dependent entries. Allocation/free-list work is linear in the number
of free extents, without sorting. Metadata free-list operations are also linear
in their free-block count. Rehashing is amortized; pressure reclamation visits
active entries and their tags, with additional free-list work per released entry.
`get` copies the payload; streaming uses bounded adapter memory independent of
payload length. `setFile` reads directly into the shared allocation in bounded
chunks but cannot guarantee a coherent snapshot of a concurrently edited file.

`getStats()` scans active allocations and free extents. `usedBytes` includes
pending writes and retired pinned payloads. `freeBytes` includes the unallocated
tail. `metadataUsedBytes` is the arena high-water offset, including reusable
holes. Registry names persist for the cache lifetime; workloads with unlimited
distinct names eventually exhaust metadata, even after deleting their entries.

There is no compaction, shrinking, eviction policy, concurrent access support,
or crash recovery. Fragmentation can prevent an allocation despite sufficient
total free bytes. A worker terminated with a reservation or lease can leak it.
Always finish or destroy streams before transferring ownership or terminating
workers. An abandoned, unconsumed readable retains its lease. Buffers are trusted
in-process capabilities: do not mutate their metadata directly, attach
mismatched buffers, or access them simultaneously from multiple threads.

## Tests

```sh
NODE_OPTIONS='' npm run test:shared-cache
```

The isolated Vitest configuration does not load existing cache consumers.
Coverage includes shared attachment, hash chaining and rehashing, growth,
invalidation, free-region reuse, fragmentation, coalescing, failed replacements,
snapshot pinning, cancellation, upstream/downstream failures, bounded file
streaming with backpressure, overlapping reader leases, and sequential
single-worker handoff with allocation-overlap checks. The wrapper suite covers
V8 value serialization, reusable tags, file freshness and changing-file retries,
namespaces, missing files, capacity failures, and in-place clear.
