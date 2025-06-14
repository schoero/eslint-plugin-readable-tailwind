import fs from "node:fs";

import enhancedResolve from "enhanced-resolve";


// @ts-expect-error - type mismatch
const fileSystem = new enhancedResolve.CachedInputFileSystem(fs, 30_000);

export const esmResolver = enhancedResolve.ResolverFactory.createResolver({
  conditionNames: ["node", "import"],
  extensions: [".mjs", ".js"],
  fileSystem,
  mainFields: ["module"],
  useSyncFileSystemCalls: true
});

export const cjsResolver = enhancedResolve.ResolverFactory.createResolver({
  conditionNames: ["node", "require"],
  extensions: [".js", ".cjs"],
  fileSystem,
  mainFields: ["main"],
  useSyncFileSystemCalls: true
});

export const cssResolver = enhancedResolve.ResolverFactory.createResolver({
  conditionNames: ["style"],
  extensions: [".css"],
  fileSystem,
  mainFields: ["style"],
  useSyncFileSystemCalls: true
});

export const jsonResolver = enhancedResolve.ResolverFactory.createResolver({
  conditionNames: ["json"],
  extensions: [".json"],
  fileSystem,
  useSyncFileSystemCalls: true
});
