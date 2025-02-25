import { findFileRecursive } from "../utils/config.js";
import { cssResolver } from "../utils/resolvers.js";


export function findTailwindConfig(cwd: string, configPath?: string) {
  const potentialStylesheetPaths = [
    ...configPath ? [configPath] : []
  ];
  const potentialConfigPaths = [
    ...configPath ? [configPath] : [],
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
    "tailwind.config.ts"
  ];

  const foundStylesheetPath = findFileRecursive(cwd, potentialStylesheetPaths);
  const foundConfigPath = findFileRecursive(cwd, potentialConfigPaths);
  const defaultStyleSheetPath = cssResolver.resolveSync({}, cwd, "tailwindcss/theme.css");

  const path = foundStylesheetPath ?? foundConfigPath ?? defaultStyleSheetPath;

  if(!path){
    throw new Error("Could not find a valid Tailwind CSS configuration");
  }

  return path;
}
