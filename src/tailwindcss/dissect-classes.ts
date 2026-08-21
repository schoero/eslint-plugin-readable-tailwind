import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { withOperationCache } from "better-tailwindcss:utils/cache.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export interface DissectedClass {
  base: string;
  className: string;
  important: [start: boolean, end: boolean];
  negative: boolean;
  prefix: string;
  separator: string;
  /** Will be undefined in tailwindcss 4 for non-tailwind classes. */
  variants: string[] | undefined;
}

export interface DissectedClasses {
  [className: string]: DissectedClass;
}

export type GetDissectedClasses = (ctx: AsyncContext, classes: string[]) => {
  dissectedClasses: DissectedClasses;
  warnings: (Warning | undefined)[];
};

export let getDissectedClasses: GetDissectedClasses = () => { throw new Error("getDissectedClasses() called before being initialized"); };

export function createGetDissectedClasses(ctx: Context): GetDissectedClasses {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getDissectedClasses = withOperationCache<GetDissectedClasses>("getDissectedClasses", (ctx, classes) => runWorker("getDissectedClasses", ctx, classes));

  return getDissectedClasses;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
