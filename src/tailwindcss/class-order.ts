import { createTailwindWorkerRunner } from "better-tailwindcss:utils/worker.js";

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
  const runWorker = createTailwindWorkerRunner(ctx);

  getClassOrder = (ctx, classes) => runWorker("getClassOrder", ctx, classes);

  return getClassOrder;
}
