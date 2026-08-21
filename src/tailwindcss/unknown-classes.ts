import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { withPerClassCache } from "better-tailwindcss:utils/cache.js";
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

  // whether a class is unknown does not depend on the rest of the list
  // so it is more efficient than operation cache
  getUnknownClasses = (ctx, classes) => ({
    unknownClasses: withPerClassCache(`unknown-class-${ctx.cwd}-${ctx.tsconfigPath}`, ctx.tailwindConfigPath, classes, uncachedClasses => runWorker("getUnknownClasses", ctx, uncachedClasses).unknownClasses),
    warnings: ctx.warnings
  });

  return getUnknownClasses;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
