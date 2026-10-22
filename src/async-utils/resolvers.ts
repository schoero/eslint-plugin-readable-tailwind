import fs from "node:fs";

import enhancedResolve from "enhanced-resolve";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

import { CachedStore } from "./cached-store.js";

import type { AsyncContext } from "../utils/context.js";
import type { CachedStoreState } from "./cached-store.js";


type Resolver = ReturnType<typeof enhancedResolve.ResolverFactory.createResolver>;

const fileSystem = new enhancedResolve.CachedInputFileSystem(fs, 30_000);

// resolvers are not serializable, the cache entry only tracks whether the local instance is still valid
function createCachedResolver(name: string, { conditionNames, extensions, mainFields }: { conditionNames: string[]; extensions: string[]; mainFields: string[]; }) {
  let cached: undefined | { resolver: Resolver; state: CachedStoreState; tsconfigPath: string | undefined; };

  return (ctx: AsyncContext | undefined): Resolver => {
    const tsconfigPath = ctx?.tsconfigPath;
    const key = [name, tsconfigPath];
    const state = CachedStore.getSharedState();

    if(cached?.state === state && cached.tsconfigPath === tsconfigPath && CachedStore.has(key)){
      return cached.resolver;
    }

    const resolver = enhancedResolve.ResolverFactory.createResolver({
      conditionNames,
      extensions,
      fileSystem,
      mainFields,
      plugins: tsconfigPath ? [new TsconfigPathsPlugin({ configFile: tsconfigPath, mainFields })] : [],
      useSyncFileSystemCalls: true
    });

    CachedStore.upsert(key, true, { paths: tsconfigPath ? [tsconfigPath] : [] });
    cached = { resolver, state, tsconfigPath };

    return resolver;
  };
}

const getESMResolver = createCachedResolver("esm-resolver", { conditionNames: ["node", "import"], extensions: [".mjs", ".js"], mainFields: ["module"] });
const getCJSResolver = createCachedResolver("cjs-resolver", { conditionNames: ["node", "require"], extensions: [".js", ".cjs"], mainFields: ["main"] });
const getCSSResolver = createCachedResolver("css-resolver", { conditionNames: ["style"], extensions: [".css"], mainFields: ["style"] });

const jsonResolver = enhancedResolve.ResolverFactory.createResolver({
  conditionNames: ["json"],
  extensions: [".json"],
  fileSystem,
  useSyncFileSystemCalls: true
});


export function resolveJs(path: string, cwd: string): string;
export function resolveJs(ctx: AsyncContext, path: string, cwd?: string): string;
export function resolveJs(ctxOrPath: AsyncContext | string | undefined, pathOrCwd: string, cwdOrUndefined?: string): string {
  const ctx = typeof ctxOrPath === "object" ? ctxOrPath : undefined;
  const path = typeof ctxOrPath === "string" ? ctxOrPath : pathOrCwd;
  const cwd = (typeof ctxOrPath === "object" ? cwdOrUndefined : pathOrCwd)!;

  try {
    return getESMResolver(ctx).resolveSync({}, cwd, path) || path;
  } catch {
    return getCJSResolver(ctx).resolveSync({}, cwd, path) || path;
  }
}

export function resolveCss(path: string, cwd: string): string;
export function resolveCss(ctx: AsyncContext, path: string, cwd?: string): string;
export function resolveCss(ctxOrPath: AsyncContext | string | undefined, pathOrCwd: string, cwdOrUndefined?: string): string {
  const ctx = typeof ctxOrPath === "object" ? ctxOrPath : undefined;
  const path = typeof ctxOrPath === "string" ? ctxOrPath : pathOrCwd;
  const cwd = (typeof ctxOrPath === "object" ? cwdOrUndefined : pathOrCwd)!;

  try {
    return getCSSResolver(ctx).resolveSync({}, cwd, path) || path;
  } catch {
    return path;
  }
}

export function resolveJson(path: string, cwd: string): string | undefined {
  try {
    return jsonResolver.resolveSync({}, cwd, path) || undefined;
  } catch {}
}
