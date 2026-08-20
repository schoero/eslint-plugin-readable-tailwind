import { getModifiedDate } from "./fs.js";


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

export function clearCache() {
  CACHE.clear();
}
