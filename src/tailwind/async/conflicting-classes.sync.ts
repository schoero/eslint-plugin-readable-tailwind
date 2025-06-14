// runner.js
import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { getTailwindcssVersion, isTailwindcssVersion4 } from "../utils/version.js";
import { getWorkerOptions } from "../utils/worker.js";

import type { GetConflictingClassesRequest, GetConflictingClassesResponse } from "../api/interface.js";
import type { TailwindcssVersion } from "../utils/version.js";


const workerPath = getWorkerPath();
const version = getTailwindcssVersion();
const workerOptions = getWorkerOptions();

const getConflictingClassesSync = createSyncFn<(version: TailwindcssVersion.V4, request: GetConflictingClassesRequest) => any>(workerPath, workerOptions);


export function getConflictingClasses(request: GetConflictingClassesRequest): GetConflictingClassesResponse {
  if(!isTailwindcssVersion4(version.major)){
    throw new Error(`Unsupported Tailwind CSS version: ${version.major}`);
  }

  return getConflictingClassesSync(version.major, request) as GetConflictingClassesResponse;
}

function getWorkerPath() {
  return resolve(getCurrentDirectory(), "./conflicting-classes.async.js");
}


function getCurrentDirectory() {
  // eslint-disable-next-line eslint-plugin-typescript/prefer-ts-expect-error
  // @ts-ignore - `import.meta` doesn't exist in CommonJS -> will be transformed in build step
  return import.meta.dirname;
}
