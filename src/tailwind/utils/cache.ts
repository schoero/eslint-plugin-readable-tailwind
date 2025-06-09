import { getModifiedDate } from "../utils/fs.js";


const CACHE = new Map<string, { date: Date; value: any; }>();

export async function withCache<T>(key: string, callback: () => Promise<T>): Promise<T> {
  const modified = getModifiedDate(key);
  const cached = CACHE.get(key);

  if(cached && cached.date > modified){
    return cached.value;
  }

  const value = await callback();
  CACHE.set(key, { date: new Date(), value });

  return value;
}
