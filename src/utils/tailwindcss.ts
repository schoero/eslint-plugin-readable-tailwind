import { readFileSync } from "node:fs";

import { object, parse, string } from "valibot";

import { CachedStore, CacheEntry } from "better-tailwindcss:utils/cached-store.js";
import { resolveJson } from "better-tailwindcss:utils/resolvers.js";
import { parseSemanticVersion } from "better-tailwindcss:utils/version.js";


const packageJsonSchema = object({
  version: string()
});

export function getTailwindPackageJsonPath(cwd: string) {
  CachedStore.upsert(CacheEntry.CWD, cwd);

  return CachedStore.getOrCreate(
    CacheEntry.TAILWIND_PACKAGE_JSON_PATH,
    () => resolveJson("tailwindcss/package.json", cwd),
    { dependencies: [CacheEntry.CWD] }
  );
}

export function getTailwindVersion(packageJsonPath: string) {
  return CachedStore.getOrCreate(
    CacheEntry.TAILWIND_VERSION,
    () => {
      const packageJson = parse(packageJsonSchema, JSON.parse(readFileSync(packageJsonPath, "utf-8")));
      return parseSemanticVersion(packageJson.version);
    },
    { dependencies: [CacheEntry.TAILWIND_PACKAGE_JSON_PATH], paths: [packageJsonPath] }
  );
}
