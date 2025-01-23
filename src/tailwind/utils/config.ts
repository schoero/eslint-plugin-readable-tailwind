import { existsSync } from "node:fs";
import path, { resolve } from "node:path";


export function findFileRecursive(cwd: string, paths: string[]) {
  for(const configPath of paths){
    const resolvedPath = resolve(cwd, configPath);
    if(existsSync(resolvedPath)){
      return resolvedPath;
    }
  }

  const parentDirectory = path.resolve(cwd, "..");

  if(cwd === parentDirectory){
    return;
  }

  return findFileRecursive(parentDirectory, paths);
}
