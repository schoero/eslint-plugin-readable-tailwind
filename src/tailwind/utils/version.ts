import { readFileSync } from "node:fs";

import { withCache } from "../utils/cache.js";
import { jsonResolver } from "../utils/resolvers.js";


export const enum TailwindcssVersion {
  V3 = 3,
  V4 = 4
}

export type SupportedTailwindVersion = TailwindcssVersion.V3 | TailwindcssVersion.V4;

export function isSupportedVersion(version: number): version is SupportedTailwindVersion {
  return version === TailwindcssVersion.V3 || version === TailwindcssVersion.V4;
}

export function isTailwindcssVersion3(version: number): version is TailwindcssVersion.V3 {
  return version === TailwindcssVersion.V3;
}

export function isTailwindcssVersion4(version: number): version is TailwindcssVersion.V4 {
  return version === TailwindcssVersion.V4;
}

export function getTailwindcssVersion() {
  const packageJsonPath = jsonResolver.resolveSync({}, process.cwd(), "tailwindcss/package.json");

  if(!packageJsonPath){
    throw new Error("Could not find a Tailwind CSS package.json");
  }

  return withCache(packageJsonPath, () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    if(!packageJson){
      throw new Error("Error reading Tailwind CSS package.json");
    }

    return parseSemanticVersion(packageJson.version);
  });
}

function parseSemanticVersion(version: string): { major: number; minor: number; patch: number; identifier?: string; } {
  const [major, minor, patchString] = version.split(".");
  const [patch, identifier] = patchString.split("-");

  return { identifier, major: +major, minor: +minor, patch: +patch };
}
