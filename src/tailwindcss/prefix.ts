import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { CachedStore, CacheEntry } from "better-tailwindcss:utils/cached-store.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type Prefix = string;
export type Suffix = string;

export type GetPrefix = (ctx: AsyncContext) => {
  prefix: Prefix;
  suffix: Suffix;
  warnings: (Warning | undefined)[];
};

export let getPrefix: GetPrefix = () => { throw new Error("getPrefix() called before being initialized"); };

export function createGetPrefix(ctx: Context): GetPrefix {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getPrefix = ctx => ({
    ...CachedStore.getOrCreate(
      "prefix",
      () => runWorker("getPrefix", CachedStore.getSharedState(), ctx),
      { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
    ),
    warnings: ctx.warnings
  });

  return getPrefix;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
