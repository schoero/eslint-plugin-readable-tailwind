import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { withOperationCache } from "better-tailwindcss:utils/cache.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type VariantOrder = Record<string, number | undefined>;

export type GetVariantOrder = (ctx: AsyncContext, classes: string[]) => {
  variantOrder: VariantOrder;
  warnings: (Warning | undefined)[];
};

export let getVariantOrder: GetVariantOrder = () => { throw new Error("getVariantOrder() called before being initialized"); };

export function createGetVariantOrder(ctx: Context): GetVariantOrder {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getVariantOrder = withOperationCache<GetVariantOrder>("getVariantOrder", (ctx, classes) => runWorker("getVariantOrder", ctx, classes));

  return getVariantOrder;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
