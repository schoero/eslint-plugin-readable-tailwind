import { findFileRecursive } from "../utils/config.js";
import { cssResolver } from "../utils/resolvers.js";


export function findTailwindConfig(cwd: string, configPath?: string) {
  const potentialStylesheetPaths = [
    ...configPath ? [configPath] : []
  ];

  return findFileRecursive(cwd, potentialStylesheetPaths);
}

export function findDefaultConfig(cwd: string) {
  const defaultStyleSheetPath = cssResolver.resolveSync({}, cwd, "tailwindcss/theme.css");

  return {
    invalidate: false,
    path: defaultStyleSheetPath
  };
}
