import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { CachedStore, CacheEntry } from "better-tailwindcss:utils/cached-store.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type UnknownClass = string;

export type GetUnknownClasses = (ctx: AsyncContext, classes: string[]) => {
  unknownClasses: UnknownClass[];
  warnings: (Warning | undefined)[];
};

export let getUnknownClasses: GetUnknownClasses = () => { throw new Error("getUnknownClasses() called before being initialized"); };

export function createGetUnknownClasses(ctx: Context): GetUnknownClasses {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  // whether a class is unknown does not depend on the other classes, so only new classes reach the worker
  getUnknownClasses = (ctx, classes) => {
    const unknown = CachedStore.getOrCreateEach(
      classes.map(className => ["unknown-class", className]),
      missing => {
        const missingClasses = missing.map(index => classes[index]);
        const unknownClasses = new Set(runWorker("getUnknownClasses", CachedStore.getSharedState(), ctx, missingClasses));
        return missingClasses.map(className => unknownClasses.has(className));
      },
      { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
    );

    return {
      unknownClasses: classes.filter((_, index) => unknown[index]),
      warnings: ctx.warnings
    };
  };

  return getUnknownClasses;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
