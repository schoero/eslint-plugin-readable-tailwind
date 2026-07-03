import { createTailwindWorkerRunner } from "better-tailwindcss:utils/worker.js";

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
  const runWorker = createTailwindWorkerRunner(ctx);

  getCustomComponentClasses = ctx => runWorker("getCustomComponentClasses", ctx);

  return getCustomComponentClasses;
}
