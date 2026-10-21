// runner.js


import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { CachedStore, CacheEntry } from "better-tailwindcss:utils/cached-store.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type CustomComponentClasses = string[];

export type GetCustomComponentClasses = (ctx: AsyncContext) => {
  customComponentClasses: CustomComponentClasses;
  warnings: (Warning | undefined)[];
};

export let getCustomComponentClasses: GetCustomComponentClasses = () => { throw new Error("getCustomComponentClasses() called before being initialized"); };

export function createGetCustomComponentClasses(ctx: Context): GetCustomComponentClasses {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getCustomComponentClasses = ctx => ({
    // derived from the same css files as the tailwind context, which tracks all of them
    customComponentClasses: CachedStore.getOrCreate(
      "custom-component-classes",
      () => runWorker("getCustomComponentClasses", CachedStore.getSharedState(), ctx),
      { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
    ),
    warnings: ctx.warnings
  });

  return getCustomComponentClasses;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
