import { readFileSync } from "node:fs";

import { jsonResolver } from "../utils/resolvers.js";


export type SupportedTailwindVersion = 3 | 4;

export function isSupportedVersion(version: number): version is SupportedTailwindVersion {
  return version === 3 || version === 4;
}


export function getTailwindcssVersion() {
  const packageJsonPath = jsonResolver.resolveSync({}, process.cwd(), "tailwindcss/package.json");
  const packageJson = packageJsonPath && JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  if(!packageJson){
    throw new Error("Could not find a Tailwind CSS package.json");
  }

  return parseSemanticVersion(packageJson.version);
}

function parseSemanticVersion(version: string): { major: number; minor: number; patch: number; identifier?: string; } {
  const [major, minor, patchString] = version.split(".");
  const [patch, identifier] = patchString.split("-");

  return { identifier, major: +major, minor: +minor, patch: +patch };
}
