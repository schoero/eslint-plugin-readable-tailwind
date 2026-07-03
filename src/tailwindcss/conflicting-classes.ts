// runner.js
import { createTailwindWorkerRunner } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type ConflictingClasses = {
  [className: string]: {
    [conflictingClassName: string]: {
      cssPropertyName: string;
      important: boolean;
      cssPropertyValue?: string;
    }[];
  };
};

export type GetConflictingClasses = (ctx: AsyncContext, classes: string[]) => {
  conflictingClasses: ConflictingClasses;
  warnings: (Warning | undefined)[];
};

export let getConflictingClasses: GetConflictingClasses = () => { throw new Error("getConflictingClasses() called before being initialized"); };

export function createGetConflictingClasses(ctx: Context): GetConflictingClasses {
  const runWorker = createTailwindWorkerRunner(ctx);

  getConflictingClasses = (ctx, classes) => runWorker("getConflictingClasses", ctx, classes);

  return getConflictingClasses;
}
