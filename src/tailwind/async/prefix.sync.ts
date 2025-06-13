// runner.js
import { resolve } from "node:path";
import { env } from "node:process";

import { createSyncFn, TsRunner } from "synckit";

import { getTailwindcssVersion, isSupportedVersion } from "../utils/version.js";

import type { GetPrefixRequest, GetPrefixResponse } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


const workerPath = getWorkerPath();
const version = getTailwindcssVersion();
const workerOptions = getWorkerOptions();

const getPrefixSync = createSyncFn<(version: SupportedTailwindVersion, request: GetPrefixRequest) => any>(workerPath, workerOptions);


export function getPrefix(request: GetPrefixRequest): GetPrefixResponse {
  if(!isSupportedVersion(version.major)){
    throw new Error(`Unsupported Tailwind CSS version: ${version.major}`);
  }

  return getPrefixSync(version.major, request) as GetPrefixResponse;
}


function getWorkerPath() {
  return resolve(getCurrentDirectory(), "./prefix.async.js");
}

function getWorkerOptions() {
  if(env.NODE_ENV === "test"){
    return { execArgv: ["--import", TsRunner.TSX] };
  }
}

function getCurrentDirectory() {
  // eslint-disable-next-line eslint-plugin-typescript/prefer-ts-expect-error
  // @ts-ignore - `import.meta` doesn't exist in CommonJS -> will be transformed in build step
  return import.meta.dirname;
}
