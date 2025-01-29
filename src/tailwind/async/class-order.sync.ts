// runner.js
import { resolve } from "node:path";
import { env } from "node:process";

import { createSyncFn, TsRunner } from "synckit";

import { getTailwindcssVersion, isSupportedVersion } from "../utils/version.js";

import type { GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


const workerPath = getWorkerPath();
const version = getTailwindcssVersion();
const workerOptions = getWorkerOptions();

const getClassOrderSync = createSyncFn<(version: SupportedTailwindVersion, request: GetClassOrderRequest) => any>(workerPath, workerOptions);


export function getClassOrder(request: GetClassOrderRequest): GetClassOrderResponse {
  if(!isSupportedVersion(version.major)){
    throw new Error(`Unsupported Tailwind CSS version: ${version.major}`);
  }

  return getClassOrderSync(version.major, request) as GetClassOrderResponse;
}


function getWorkerPath() {
  return resolve(getDirName(), "./class-order.async.js");
}

function getWorkerOptions() {
  if(env.NODE_ENV === "test"){
    return { execArgv: ["--import", TsRunner.TSX] };
  }
}

function getDirName() {
  // eslint-disable-next-line eslint-plugin-typescript/ban-ts-comment, eslint-plugin-typescript/prefer-ts-expect-error
  // @ts-ignore
  return import.meta.dirname ?? __dirname;
}
