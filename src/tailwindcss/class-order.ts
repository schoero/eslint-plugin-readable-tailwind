import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { CachedStore, CacheEntry } from "better-tailwindcss:utils/cached-store.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type ClassOrder = [className: string, order: bigint | null][];

export type GetClassOrder = (ctx: AsyncContext, classes: string[]) => {
  classOrder: ClassOrder;
  warnings: (Warning | undefined)[];
};

export let getClassOrder: GetClassOrder = () => { throw new Error("getClassOrder() called before being initialized"); };

export function createGetClassOrder(ctx: Context): GetClassOrder {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getClassOrder = (ctx, classes) => ({
    classOrder: CachedStore.getOrCreate(
      ["class-order", ...classes],
      () => runWorker("getClassOrder", CachedStore.getSharedState(), ctx, classes),
      { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
    ),
    warnings: ctx.warnings
  });

  return getClassOrder;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
