import { getModifiedDate } from "./fs.js";

import type { AsyncContext } from "../utils/context.js";


interface CacheItem {
  date: Date;
  value: any;
}

class LruCache {

  private cache = new Map<string, CacheItem>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheItem | undefined {
    const item = this.cache.get(key);

    if(item){
      // fresh access, move to the end
      this.cache.delete(key);
      this.cache.set(key, item);
    }

    return item;
  }

  set(key: string, item: CacheItem): void {
    // fresh write, move to the end if present
    this.cache.delete(key);
    this.cache.set(key, item);

    // size limit
    if(this.cache.size > this.maxSize){
      const oldestKey = this.cache.keys().next().value;

      if(oldestKey !== undefined){
        this.cache.delete(oldestKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

}

// operation results and resolved configs are few but potentially large
const CACHE = new LruCache(1000);

// per-class verdicts are booleans, but every distinct class name ever seen creates an entry
const CLASS_CACHE = new LruCache(20_000);

export function invalidateByModifiedDate(cache: CacheItem, path: string | undefined): boolean {
  // without a path there is no file to watch for staleness
  // the entry stays cached until clearCache() or lru eviction
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

/**
 * Caches an operation that filters a class list per class.
 *
 * @param key Unique name of the operation, used as part of the cache key.
 * @param path Path of the file to watch for changes.
 * @param classes The classes to filter.
 * @param filterClasses The operation, called with the classes that have no cached verdict yet.
 * @returns The classes for which the operation's verdict is positive, in input order.
 */
export function withPerClassCache(key: string, path: string | undefined, classes: string[], filterClasses: (uncachedClasses: string[]) => string[]): string[] {
  const modified = path ? getModifiedDate(path) : undefined;

  const verdicts = new Map<string, boolean>();
  const uncachedClasses: string[] = [];

  for(const className of classes){

    if(verdicts.has(className)){
      continue;
    }

    const cached = CLASS_CACHE.get(`${key}-${className}-${path}`);

    if(cached && !(modified && modified > cached.date)){
      verdicts.set(className, cached.value as boolean);
    } else {
      uncachedClasses.push(className);
      verdicts.set(className, false);
    }
  }

  if(uncachedClasses.length > 0){
    const matchedClasses = new Set(filterClasses(uncachedClasses));
    const date = new Date();

    for(const className of uncachedClasses){
      const value = matchedClasses.has(className);

      verdicts.set(className, value);
      CLASS_CACHE.set(`${key}-${className}-${path}`, { date, value });
    }
  }

  return classes.filter(className => verdicts.get(className));
}

export function clearCache() {
  CACHE.clear();
  CLASS_CACHE.clear();
}
