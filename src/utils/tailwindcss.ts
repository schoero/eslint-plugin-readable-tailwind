import { readFileSync } from "node:fs";

import { literal, object, parse, string } from "valibot";

import { CachedStore, CacheTag } from "better-tailwindcss:utils/cached-store.js";
import { resolveJson } from "better-tailwindcss:utils/resolvers.js";
import { parseSemanticVersion } from "better-tailwindcss:utils/version.js";


const packageJsonSchema = object({
  name: literal("tailwindcss"),
  version: string()
});

export function getTailwindPackageJsonPath(cwd: string) {
  return CachedStore.getOrCreate(
    "tailwind-package-json-path",
    () => {
      return resolveJson("tailwindcss/package.json", cwd);
    },
    { tags: [CacheTag.CWD] }
  );
}

export function getTailwindVersion(packageJsonPath: string) {
  return CachedStore.getOrCreate(
    "tailwind-version",
    () => {
      const packageJson = parse(packageJsonSchema, JSON.parse(readFileSync(packageJsonPath, "utf-8")));
      return parseSemanticVersion(packageJson.version);
    },
    { paths: [packageJsonPath], tags: [CacheTag.CWD] }
  );
}
