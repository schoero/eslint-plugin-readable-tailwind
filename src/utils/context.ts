import { resolve } from "node:path";

import { CachedStore, CacheEntry } from "better-tailwindcss:utils/cached-store.js";
import { findPathRecursive } from "better-tailwindcss:utils/fs.js";
import { resolveCss } from "better-tailwindcss:utils/resolvers.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context, Version } from "better-tailwindcss:types/rule.js";


export interface AsyncContext {
  cwd: string;
  installation: string;
  tailwindConfigPath: string;
  tsconfigPath: string | undefined;
  version: Version;
  warnings: (Warning | undefined)[];
}

export function async(ctx: Context): AsyncContext {
  const { path: resolvedTailwindPath, warnings: tailwindConfigWarnings } = getTailwindConfigPath({ configPath: ctx.options.entryPoint ?? ctx.options.tailwindConfig, cwd: ctx.cwd, version: ctx.version });
  const { path: resolvedTSConfigPath, warnings: tsconfigWarnings } = getTSConfigPath({ configPath: ctx.options.tsconfig, cwd: ctx.cwd });

  // cached results only depend on the tailwind context transitively, which never accesses the file system
  // this records changes to the files the context was built from without a round trip to the worker
  CachedStore.refreshPaths(CacheEntry.TAILWIND_CONTEXT);

  return {
    cwd: ctx.cwd,
    installation: ctx.installation,
    tailwindConfigPath: resolvedTailwindPath,
    tsconfigPath: resolvedTSConfigPath,
    version: ctx.version,
    warnings: [...tailwindConfigWarnings, ...tsconfigWarnings]
  };
}

// only one tsconfig path is cached, it is resolved again when the cwd or the option changes
// or when the configured file is created or deleted
function getTSConfigPath({ configPath, cwd }: {
  configPath: string | undefined;
  cwd: string;
}) {
  CachedStore.upsert(CacheEntry.CWD, cwd);
  CachedStore.upsert(CacheEntry.TSCONFIG_OPTION, configPath);

  return CachedStore.getOrCreate(
    CacheEntry.TSCONFIG_PATH,
    () => findTSConfigPath({ configPath, cwd }),
    { dependencies: [CacheEntry.CWD, CacheEntry.TSCONFIG_OPTION], paths: getConfiguredPaths(configPath, cwd) }
  );
}

// only one tailwind config path is cached, it is resolved again when the cwd, the option or the tailwind version changes
// or when the configured file is created or deleted
export function getTailwindConfigPath({ configPath, cwd, version }: {
  configPath: string | undefined;
  cwd: string;
  version: Version;
}) {
  CachedStore.upsert(CacheEntry.CWD, cwd);
  CachedStore.upsert(CacheEntry.TAILWIND_CONFIG_OPTION, configPath);

  return CachedStore.getOrCreate(
    CacheEntry.TAILWIND_CONFIG_PATH,
    () => findTailwindConfigPath({ configPath, cwd, version }),
    { dependencies: [CacheEntry.CWD, CacheEntry.TAILWIND_CONFIG_OPTION, CacheEntry.TAILWIND_VERSION], paths: getConfiguredPaths(configPath, cwd) }
  );
}

function findTSConfigPath({ configPath, cwd }: {
  configPath: string | undefined;
  cwd: string;
}) {
  const potentialPaths = [
    ...configPath ? [configPath] : [],
    "tsconfig.json",
    "jsconfig.json"
  ];

  const foundConfigPath = findPathRecursive(cwd, cwd, potentialPaths);
  const warning = getConfigPathWarning(configPath, foundConfigPath);

  return {
    path: foundConfigPath,
    warnings: [warning]
  };
}

function findTailwindConfigPath({ configPath, cwd, version }: {
  configPath: string | undefined;
  cwd: string;
  version: Version;
}) {
  if(version.major >= 4){

    const foundConfigPath = configPath && findPathRecursive(cwd, cwd, [configPath]);
    const warning = getEntryPointWarning(configPath, foundConfigPath);

    if(foundConfigPath){
      return {
        path: foundConfigPath,
        warnings: [warning]
      };
    }

    const defaultConfigPath = resolveCss("tailwindcss/theme.css", cwd);

    if(!defaultConfigPath){
      throw new Error("No default tailwind config found. Please ensure you have Tailwind CSS installed.");
    }

    return {
      path: defaultConfigPath,
      warnings: [warning]
    };
  }

  if(version.major <= 3){
    const defaultPaths = [
      "tailwind.config.js",
      "tailwind.config.cjs",
      "tailwind.config.mjs",
      "tailwind.config.ts"
    ];

    const foundConfigPath = configPath && findPathRecursive(cwd, cwd, [configPath]);

    const foundDefaultPath = findPathRecursive(cwd, cwd, defaultPaths);
    const warning = getConfigPathWarning(configPath, foundConfigPath);

    return {
      path: foundConfigPath ?? foundDefaultPath ?? "default",
      warnings: [warning]
    };
  }

  throw new Error(`Unsupported Tailwind CSS version: ${version.major}. Please use a version between 3 and 4.`);
}

// a configured file that does not exist yet is picked up as soon as it is created
function getConfiguredPaths(configPath: string | undefined, cwd: string): string[] {
  return configPath ? [resolve(cwd, configPath)] : [];
}

function getEntryPointWarning(entryPoint: string | undefined, foundEntryPoint: string | undefined): Warning | undefined {
  if(!!entryPoint && !!foundEntryPoint){
    return;
  }

  return {
    option: "entryPoint",
    title: `No tailwind css entry point found at \`${entryPoint}\``
  };
}


function getConfigPathWarning(configPath: string | undefined, foundConfigPath: string | undefined): Warning | undefined {
  if(!configPath){
    return;
  }

  if(foundConfigPath && resolve(configPath) === resolve(foundConfigPath)){
    return;
  }

  return {
    option: "tsconfig",
    title: `No tsconfig found at \`${configPath}\``
  };
}
