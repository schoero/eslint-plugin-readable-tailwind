import { findFileRecursive } from "../utils/fs.js";
import { cssResolver } from "../utils/resolvers.js";


export function findTailwindConfigPath(cwd: string, configPath?: string) {
  const potentialStylesheetPaths = [
    ...configPath ? [configPath] : []
  ];

  return findFileRecursive(cwd, potentialStylesheetPaths);
}

export function findDefaultConfig(cwd: string) {
  return cssResolver.resolveSync({}, cwd, "tailwindcss/theme.css");
}
