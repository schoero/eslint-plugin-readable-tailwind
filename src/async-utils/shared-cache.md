# Cache

The plugin caches everything it derives from the Tailwind CSS configuration in one cache that the ESLint thread and the synckit worker running Tailwind CSS share. A result that ESLint finds in the cache never reaches the worker.

The cache has two layers:

- [shared-cache.ts](./shared-cache.ts): `SharedCache`, a binary key-value store in two growable `SharedArrayBuffer`s, one for metadata and one for payloads. It tracks versions, dependencies between entries, file modification times, and the least recently used order.
- [cached-store.ts](./cached-store.ts): `CachedStore`, the static wrapper the plugin uses. It owns the buffers, builds keys, serializes values, and records dependencies.

<br/>

## Single owner

There are no locks or atomic operations, so only one thread may access the buffers at a time. This holds because synckit blocks the ESLint thread while the worker handles a call. Every worker call passes `CachedStore.getSharedState()`, and the worker calls `CachedStore.attachSharedState()` before handling it, see `tailwind.async.worker.v3.ts` and `tailwind.async.worker.v4.ts`.

<br/>

## Using the cache

### Keys and values

Keys are strings, numbers, booleans, or arrays of those. `undefined` array members are dropped. Keys longer than 64 characters as JSON, for example large class lists, are replaced by a SHA-256 prefix. Values are serialized with `node:v8`, so dates, maps, sets, and typed arrays round-trip and functions throw. `undefined` is cached like any other value.

- `getOrCreate(key, create, { dependencies, paths })` returns the cached value or calls `create`, which may return a promise. Rejections are not cached.
- `getOrCreateEach(keys, create, options)` does the same for many keys at once. `create` receives the indexes of the missing keys and returns their values in the same order. Unknown classes use it, so only classes that were not checked before reach Tailwind CSS.
- `upsert(key, value, options)` writes inputs such as the cwd or an option on every call. Writing an identical value keeps the version of the entry, so only actual changes invalidate its dependents.
- `readFile(path)` returns the content of a file and caches it until the modification time of the file changes.

### Dependencies

`dependencies` are other cache keys and `paths` are files. Their versions are recorded before the value is created, so a change during its creation makes the value stale right away. A value is not stored at all when a dependency is missing or changed while it was created.

An entry is valid while all of its dependencies are valid and still have their recorded version. This is checked transitively when the entry is read. Reading an entry also stats the files it depends on directly. Entries that only depend on files transitively never access the file system.

The shared entries are listed in the `CacheEntry` enum:

| Entry | Depends on |
| --- | --- |
| `CWD`, `TAILWIND_CONFIG_OPTION`, `TSCONFIG_OPTION` | Written with `upsert()` on every call |
| `TAILWIND_PACKAGE_JSON_PATH` | `CWD` |
| `TAILWIND_VERSION` | `TAILWIND_PACKAGE_JSON_PATH` and the `package.json` file |
| `TSCONFIG_PATH` | `CWD`, `TSCONFIG_OPTION`, and the configured file |
| `TAILWIND_CONFIG_PATH` | `CWD`, `TAILWIND_CONFIG_OPTION`, `TAILWIND_VERSION`, and the configured file |
| `TAILWIND_CONTEXT` | `TAILWIND_CONFIG_PATH`, `TSCONFIG_PATH`, `TAILWIND_VERSION`, the config file, its CSS imports in Tailwind CSS v4, and the tsconfig file |

There is only ever one Tailwind CSS context. Every result computed from it, for example the class order or the unknown classes, only depends on `TAILWIND_CONTEXT`. `async(ctx)` in [context.ts](../utils/context.ts) calls `CachedStore.refreshPaths(CacheEntry.TAILWIND_CONTEXT)`, which stats the files the context was built from. A change to one of them makes all results stale without a call to the worker.

### Worker results

The getters in [src/tailwindcss](../tailwindcss/) wrap the worker call in `getOrCreate` with a dependency on `TAILWIND_CONTEXT`. ESLint records the version of the context before it calls the worker, so it does not store a result for which the worker had to rebuild the context first. Canonical classes, dissected classes, and unknown classes are therefore also cached inside the worker, under the same keys as in ESLint. These keys have to match on both sides.

### Objects that can not be serialized

The Tailwind CSS context and the `enhanced-resolve` resolvers stay in module variables of the thread that created them. The cache only holds a `true` entry with their dependencies, and the object is reused while that entry is valid. The context entry is deleted before the context is rebuilt, because writing an identical `true` would keep its version and everything derived from the previous context would stay valid.

### Capacity

The buffers are created on first use. With ESLint's `--concurrency` option, every thread creates its own buffers and its own worker. Their maximum is the `cacheSize` setting per thread, 32 MB by default, a quarter for metadata and the rest for payloads. It is limited to a quarter of the memory of the system or container. The first configured size applies, a larger one replaces the buffers later. When the address space for the maximum can not be reserved, smaller buffers are created.

The buffers grow on demand and evict the least recently used entries at their maximum. When an allocation can still not fit, `SharedCache` throws a `SharedCacheCapacityError`. `CachedStore` does not let that fail the lint run: the thread that created the buffers replaces them, and the worker skips caching and asks for a replacement with `requestReset()`. `readFile()` then reads the file directly.

<br/>

## Binary layout

All integers are little-endian unsigned 32-bit values, timestamps and versions are little-endian float64 values. Offsets use zero as a null reference. A buffer can address at most 2,147,483,640 bytes.

### Metadata buffer

The metadata buffer starts with a 56-byte header:

| Byte offset | Field |
| --- | --- |
| 0 | Initialization marker |
| 4 | Reset request flag set by `requestReset()` |
| 8 | End of the used metadata |
| 12 | Head of the free block list, sorted by offset |
| 16, 20 | Offset and size of the hash bucket table |
| 24 | Number of entries in the hash table |
| 28 | Most recently used entry |
| 32 | End of the used data |
| 36 | Head of the free extent list, sorted by offset |
| 40 | Logical clock |
| 48 | Least recently used entry |

The rest of the buffer is split into 8-byte aligned blocks. Each block starts with its size and the offset of the next free block. Freed blocks are merged with adjacent free blocks.

The hash table starts with 16 buckets and doubles at a load factor of two. Keys are hashed with FNV-1a over their UTF-16 code units. Only live entries are in the hash table.

Each entry has an 88-byte header followed by its key:

| Byte offset | Field |
| --- | --- |
| 0, 52 | Next and previous entry, from the most to the least recently used |
| 4 | Next entry in the same hash bucket |
| 8, 12, 16 | Data offset, payload length, and reserved capacity |
| 20 | State: writing (1), live (2), retired (3), or free extent (4) |
| 24 | Number of readers that pin the entry |
| 28 | Key hash |
| 32 | Modification time, for path entries |
| 40 | Logical time at which the entry was reserved |
| 48 | Head of the dependency list |
| 56, 60 | Kind, key (1) or path (2), and key length in bytes |
| 64 | Invalidation flag |
| 72 | Version |
| 80 | Logical clock at the last successful validation |
| 88 | UTF-16 key |

Paths are entries without payload. Their version changes whenever their recorded modification time changes. An entry created with the `path` option, which `readFile()` uses, depends on its path entry.

Dependencies are 24-byte records followed by the key of the dependency: next dependency, key hash, kind, key length, and the recorded version. They store the key instead of an offset and look it up again when they are validated, so they never refer to freed records.

The version of an entry is the logical time at which it was reserved, or the version of the entry it replaced if both have identical payloads. The logical clock advances with every reservation, path change, and removal from the hash table. A successful validation stores the current clock in the entry, so later checks only compare one number until the clock moves again.

### Data buffer

The data buffer only contains payloads. Free extents are allocated first fit, split on allocation, and merged with adjacent free extents on release. A released entry reuses its record as a free extent, so releasing never allocates metadata. A free extent at the end of the used data is returned to it.

### Eviction

The entry list doubles as the least recently used order. Publishing an entry, reading it with `get()`, `has()`, or `version()`, and writing an identical payload move it to the front. When an allocation would grow a buffer beyond its maximum, stale entries are reclaimed first, then the least recently used entries are evicted one at a time until the allocation fits. Entries that are being written, entries pinned while their path dependencies are refreshed, and path entries are never evicted. Evicting an entry advances the logical clock, so entries that depend on it become stale.

<br/>

## Limits

- An entry that is replaced stays readable until its replacement is published. A write that fails, or whose dependencies become stale while it is written, is not published and releases its reservation.
- Content changes that keep the modification time of a file are not detected.
- Validation follows dependencies to a depth of 32.
- The buffers are never compacted or shrunk. Fragmentation can prevent an allocation despite enough free bytes in total.
- A worker that is terminated while it writes to the cache can leak the reservation.

<br/>

## Tests

```sh
NODE_OPTIONS='' npm run test -- --run tests/unit/shared-cache.test.ts tests/unit/cached-store.test.ts tests/unit/context-invalidation.test.ts
```
