import fs from "node:fs";

import enhancedResolve from "enhanced-resolve";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

import { CachedStore, CacheTag } from "./cached-store.js";

import type { AsyncContext } from "../utils/context.js";
import type { CachedStoreState } from "./cached-store.js";


const fileSystem = new enhancedResolve.CachedInputFileSystem(fs, 30_000);

let esmResolver: ReturnType<typeof enhancedResolve.ResolverFactory.createResolver> | undefined;
let cjsResolver: ReturnType<typeof enhancedResolve.ResolverFactory.createResolver> | undefined;
let cssResolver: ReturnType<typeof enhancedResolve.ResolverFactory.createResolver> | undefined;
let resolverState: CachedStoreState | undefined;

function resolverOptions(ctx: AsyncContext | undefined) {
  const state = CachedStore.toTransferableState();
  if(resolverState !== state){
    esmResolver = undefined;
    cjsResolver = undefined;
    cssResolver = undefined;
    resolverState = state;
  }
  return {
    paths: [ctx?.cwd ?? process.cwd(), ...ctx?.tsconfigPath ? [ctx.tsconfigPath] : []],
    tags: [CacheTag.CWD, CacheTag.TS_CONFIG]
  };
}

const getESMResolver = (ctx: AsyncContext | undefined) => {
  const options = resolverOptions(ctx);
  if(esmResolver && CachedStore.isValid("esm-resolver", options)){
    return esmResolver;
  }
  const resolver = enhancedResolve.ResolverFactory.createResolver({
    conditionNames: ["node", "import"],
    extensions: [".mjs", ".js"],
    fileSystem,
    mainFields: ["module"],
    plugins: ctx?.tsconfigPath ? [new TsconfigPathsPlugin({ configFile: ctx.tsconfigPath, mainFields: ["module"] })] : [],
    useSyncFileSystemCalls: true
  });
  CachedStore.getOrCreate("esm-resolver", () => true, options);
  esmResolver = resolver;
  return esmResolver;
};

const getCJSResolver = (ctx: AsyncContext | undefined) => {
  const options = resolverOptions(ctx);
  if(cjsResolver && CachedStore.isValid("cjs-resolver", options)){
    return cjsResolver;
  }
  const resolver = enhancedResolve.ResolverFactory.createResolver({
    conditionNames: ["node", "require"],
    extensions: [".js", ".cjs"],
    fileSystem,
    mainFields: ["main"],
    plugins: ctx?.tsconfigPath ? [new TsconfigPathsPlugin({ configFile: ctx.tsconfigPath, mainFields: ["main"] })] : [],
    useSyncFileSystemCalls: true
  });
  CachedStore.getOrCreate("cjs-resolver", () => true, options);
  cjsResolver = resolver;
  return cjsResolver;
};

const getCSSResolver = (ctx: AsyncContext | undefined) => {
  const options = resolverOptions(ctx);
  if(cssResolver && CachedStore.isValid("css-resolver", options)){
    return cssResolver;
  }
  const resolver = enhancedResolve.ResolverFactory.createResolver({
    conditionNames: ["style"],
    extensions: [".css"],
    fileSystem,
    mainFields: ["style"],
    plugins: ctx?.tsconfigPath ? [new TsconfigPathsPlugin({ configFile: ctx.tsconfigPath, mainFields: ["style"] })] : [],
    useSyncFileSystemCalls: true
  });
  CachedStore.getOrCreate("css-resolver", () => true, options);
  cssResolver = resolver;
  return cssResolver;
};

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
