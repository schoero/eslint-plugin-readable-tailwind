import { getModifiedDate } from "../utils/fs.js";


const CACHE = new Map<string, { date: Date; value: any; }>();

export function withCache<Result>(key: string, callback: () => Result): Result;
export function withCache<Result>(key: string, callback: () => Promise<Result>): Promise<Result>;
export function withCache<Result>(key: string, callback: () => Promise<Result> | Result): Promise<Result> | Result {
  const modified = getModifiedDate(key);
  const cached = CACHE.get(key);

  if(cached && cached.date > modified){
    return cached.value;
  }

  const value = callback();

  if(value instanceof Promise){
    return value.then(resolvedValue => {
      CACHE.set(key, { date: new Date(), value: resolvedValue });
      return resolvedValue;
    });
  } else {
    CACHE.set(key, { date: new Date(), value });
    return value;
  }
}
