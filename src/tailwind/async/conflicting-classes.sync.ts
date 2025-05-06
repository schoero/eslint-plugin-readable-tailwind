// runner.js
import { resolve } from "node:path";
import { env } from "node:process";

import { createSyncFn, TsRunner } from "synckit";

import { getTailwindcssVersion, isSupportedVersion } from "../utils/version.js";

import type { GetConflictingClassesRequest, GetConflictingClassesResponse } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


const workerPath = getWorkerPath();
const version = getTailwindcssVersion();
const workerOptions = getWorkerOptions();

const getConflictingClassesSync = createSyncFn<(version: SupportedTailwindVersion, request: GetConflictingClassesRequest) => any>(workerPath, workerOptions);


export function getConflictingClasses(request: GetConflictingClassesRequest): GetConflictingClassesResponse {
  if(!isSupportedVersion(version.major)){
    throw new Error(`Unsupported Tailwind CSS version: ${version.major}`);
  }

  return getConflictingClassesSync(version.major, request) as GetConflictingClassesResponse;
}


function getWorkerPath() {
  return resolve(getCurrentDirectory(), "./conflicting-classes.async.js");
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
