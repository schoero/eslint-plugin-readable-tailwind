import { createTailwindWorkerRunner } from "better-tailwindcss:utils/worker.js";

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
  const runWorker = createTailwindWorkerRunner(ctx);

  getVariantOrder = (ctx, classes) => runWorker("getVariantOrder", ctx, classes);

  return getVariantOrder;
}
