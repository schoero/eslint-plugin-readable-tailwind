// runner.js
import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { getTailwindcssVersion, isSupportedVersion } from "../utils/version.js";
import { getWorkerOptions } from "../utils/worker.js";

import type { GetUnregisteredClassesRequest, GetUnregisteredClassesResponse } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


const workerPath = getWorkerPath();
const version = getTailwindcssVersion();
const workerOptions = getWorkerOptions();

const getUnregisteredClassesSync = createSyncFn<(version: SupportedTailwindVersion, request: GetUnregisteredClassesRequest) => any>(workerPath, workerOptions);


export function getUnregisteredClasses(request: GetUnregisteredClassesRequest): GetUnregisteredClassesResponse {
  if(!isSupportedVersion(version.major)){
    throw new Error(`Unsupported Tailwind CSS version: ${version.major}`);
  }

  return getUnregisteredClassesSync(version.major, request) as GetUnregisteredClassesResponse;
}


function getWorkerPath() {
  return resolve(getCurrentDirectory(), "./unregistered-classes.async.js");
}

function getCurrentDirectory() {
  // eslint-disable-next-line eslint-plugin-typescript/prefer-ts-expect-error
  // @ts-ignore - `import.meta` doesn't exist in CommonJS -> will be transformed in build step
  return import.meta.dirname;
}
