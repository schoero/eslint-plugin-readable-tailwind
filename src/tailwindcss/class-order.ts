import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { withOperationCache } from "better-tailwindcss:utils/cache.js";
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

  getClassOrder = withOperationCache<GetClassOrder>("getClassOrder", (ctx, classes) => runWorker("getClassOrder", ctx, classes));

  return getClassOrder;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
