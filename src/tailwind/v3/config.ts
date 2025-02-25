import { findFileRecursive } from "../utils/config.js";


export function findTailwindConfig(cwd: string, configPath?: string) {
  const potentialPaths = [
    ...configPath ? [configPath] : [],
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
    "tailwind.config.ts"
  ];

  return findFileRecursive(cwd, potentialPaths);
}
