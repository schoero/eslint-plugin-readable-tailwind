import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { CachedStore, CacheTag } from "better-tailwindcss:utils/cached-store.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type CanonicalClasses = {
  [originalClass: string]: {
    input: string[];
    output: string;
  };
};

export type CanonicalClassOptions = {
  collapse: boolean | undefined;
  logicalToPhysical: boolean | undefined;
  rem: number | undefined;
};

export type GetCanonicalClasses = (ctx: AsyncContext, classes: string[], options: CanonicalClassOptions) => {
  canonicalClasses: CanonicalClasses;
  warnings: (Warning | undefined)[];
};

export let getCanonicalClasses: GetCanonicalClasses = () => { throw new Error("getCanonicalClasses() called before being initialized"); };

export function createGetCanonicalClasses(ctx: Context): GetCanonicalClasses {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getCanonicalClasses = (ctx, classes, options) => CachedStore.getOrCreate(
    ["canonical-classes", ...classes, options.collapse, options.logicalToPhysical, options.rem],
    () => runWorker("getCanonicalClasses", CachedStore.toTransferableState(), ctx, classes, options),
    { tags: [CacheTag.CONTEXT] }
  );

  return getCanonicalClasses;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
