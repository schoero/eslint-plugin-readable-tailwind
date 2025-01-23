import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";


export function findFileRecursive(cwd: string, paths: string[]) {
  const resolvedPaths = paths.map(p => resolve(cwd, p));

  for(let resolvedPath = resolvedPaths.shift(); resolvedPath !== undefined; resolvedPath = resolvedPaths.shift()){
    if(existsSync(resolvedPath)){
      return resolvedPath;
    }

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
