import { existsSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";


type CachedFile = {
  invalidate: boolean;
  path: string;
};

const CACHE = new Map<string, number>();

export function findFileRecursive(cwd: string, paths: string[]): CachedFile | undefined {
  const resolvedPaths = paths.map(p => resolve(cwd, p));

  for(let resolvedPath = resolvedPaths.shift(); resolvedPath !== undefined; resolvedPath = resolvedPaths.shift()){

    if(existsSync(resolvedPath)){
      const stat = statSync(resolvedPath);

      if(!stat.isFile()){
        CACHE.delete(resolvedPath);
        continue;
      }

      const invalidate = stat.mtimeMs > (CACHE.get(resolvedPath) ?? 0);

      CACHE.set(resolvedPath, stat.mtimeMs);

      return {
        invalidate,
        path: resolvedPath
      };

    }

    CACHE.delete(resolvedPath);

    const fileName = basename(resolvedPath);
    const directory = dirname(resolvedPath);

    const parentDirectory = resolve(directory, "..");
    const parentPath = resolve(parentDirectory, fileName);

    if(parentDirectory === directory || directory === cwd){
      continue;
    }

    resolvedPaths.push(parentPath);
  }
}
