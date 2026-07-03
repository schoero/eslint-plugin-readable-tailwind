import { createTailwindWorkerRunner } from "better-tailwindcss:utils/worker.js";

import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


export type Prefix = string;
export type Suffix = string;

export type GetPrefix = (ctx: AsyncContext) => {
  prefix: Prefix;
  suffix: Suffix;
  warnings: (Warning | undefined)[];
};

export let getPrefix: GetPrefix = () => { throw new Error("getPrefix() called before being initialized"); };

export function createGetPrefix(ctx: Context): GetPrefix {
  const runWorker = createTailwindWorkerRunner(ctx);

  getPrefix = ctx => runWorker("getPrefix", ctx);

  return getPrefix;
}
