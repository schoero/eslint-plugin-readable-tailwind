import { resolve } from "node:path";
import { env } from "node:process";

import { createSyncFn, TsRunner } from "synckit";

import type { SynckitOptions } from "synckit";

import type { Context } from "../types/rule.js";
import type { Operations } from "./operations.js";


const defaultTimeout = 30_000;

type TailwindWorkerRunner = <Operation extends keyof Operations>(operation: Operation, ...args: Parameters<Operations[Operation]>) => Awaited<ReturnType<Operations[Operation]>>;

export function getWorkerOptions(): SynckitOptions | undefined {
  if(env.NODE_ENV === "test"){
    return {
      timeout: Number(env.SYNCKIT_TIMEOUT) || defaultTimeout,
      tsRunner: TsRunner.OXC
    };
  } else {
    return {
      timeout: Number(env.SYNCKIT_TIMEOUT) || defaultTimeout
    };
  }
}

export function getTailwindWorkerPath(ctx: Context) {
  return resolve(import.meta.dirname, `../tailwindcss/tailwind.async.worker.v${ctx.version.major}.js`);
}

export function createTailwindWorkerRunner(ctx: Context): TailwindWorkerRunner {
  return createSyncFn(getTailwindWorkerPath(ctx), getWorkerOptions()) as TailwindWorkerRunner;
}
