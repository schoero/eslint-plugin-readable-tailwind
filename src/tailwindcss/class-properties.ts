import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { withOperationCache } from "better-tailwindcss:utils/cache.js";
import { getWorkerOptions } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


/** Sorted css property names that a class sets, ignoring its variants. Undefined for classes that don't set any properties. */
export type ClassProperties = Record<string, string[] | undefined>;

export type GetClassProperties = (ctx: AsyncContext, classes: string[]) => {
  classProperties: ClassProperties;
  warnings: (Warning | undefined)[];
};

export let getClassProperties: GetClassProperties = () => { throw new Error("getClassProperties() called before being initialized"); };

export function createGetClassProperties(ctx: Context): GetClassProperties {
  const workerPath = getWorkerPath(ctx);
  const workerOptions = getWorkerOptions();
  const runWorker = createSyncFn(workerPath, workerOptions);

  getClassProperties = withOperationCache<GetClassProperties>("getClassProperties", (ctx, classes) => runWorker("getClassProperties", ctx, classes));

  return getClassProperties;
}

// safe to use with class names like `constructor` or `__proto__`
export function getPropertiesOfClass(classProperties: ClassProperties, className: string): string[] | undefined {
  return Object.hasOwn(classProperties, className) ? classProperties[className] : undefined;
}

function getWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `./tailwind.async.worker.v${ctx.version.major}.js`);
}
