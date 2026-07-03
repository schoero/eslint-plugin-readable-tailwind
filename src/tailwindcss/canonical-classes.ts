import { createTailwindWorkerRunner } from "better-tailwindcss:utils/worker.js";

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
  const runWorker = createTailwindWorkerRunner(ctx);

  getCanonicalClasses = (ctx, classes, options) => runWorker("getCanonicalClasses", ctx, classes, options);

  return getCanonicalClasses;
}
