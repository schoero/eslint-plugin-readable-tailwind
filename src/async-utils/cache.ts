import { getModifiedDate } from "./fs.js";

import type { AsyncContext } from "../utils/context.js";


interface CacheItem {
  date: Date;
  value: any;
}

const CACHE = new Map<string, CacheItem>();

export function invalidateByModifiedDate(cache: CacheItem, path: string | undefined): boolean {
  // without a path there is no file to watch for staleness
  // the entry stays cached until clearCache()
  // this requires callers to encode everything the callback depends on in the key
  if(!path){ return false; }

  const modified = getModifiedDate(path);
  return modified > cache.date;
}

export function withCache<Result>(key: string, path: string | undefined, callback: () => Result, invalidate?: (cache: CacheItem, path: string | undefined) => boolean): Result;
export function withCache<Result>(key: string, path: string | undefined, callback: () => Promise<Result>, invalidate?: (cache: CacheItem, path: string | undefined) => boolean): Promise<Result>;
export function withCache<Result>(key: string, path: string | undefined, callback: () => Promise<Result> | Result, invalidate: (cache: CacheItem, path: string | undefined) => boolean = invalidateByModifiedDate): Promise<Result> | Result {
  const cacheKey = `${key}-${path}`;
  const cached = CACHE.get(cacheKey);

  if(cached && !invalidate(cached, path)){
    return cached.value;
  }

  const value = callback();

  if(value instanceof Promise){
    return value.then(resolvedValue => {
      CACHE.set(cacheKey, { date: new Date(), value: resolvedValue });
      return resolvedValue;
    });
  } else {
    CACHE.set(cacheKey, { date: new Date(), value });
    return value;
  }
}

/**
 * Caches worker operation results.
 *
 * @template Operation The signature of the wrapped operation.
 * @param name Unique name of the operation, used as part of the cache key.
 * @param operation The operation to cache.
 * @returns The wrapped operation.
 */
export function withOperationCache<Operation extends (ctx: AsyncContext, ...args: any[]) => any>(name: string, operation: Operation): Operation {
  return ((ctx: AsyncContext, ...args: any[]) => withCache(
    `${name}-${ctx.cwd}-${ctx.tsconfigPath}-${JSON.stringify(args)}`,
    ctx.tailwindConfigPath,
    () => operation(ctx, ...args)
  )) as Operation;
}

export function clearCache() {
  CACHE.clear();
}
