// runner.js
import { resolve } from "node:path";

import { createSyncFn } from "synckit";

import { getTailwindcssVersion, isSupportedVersion } from "../utils/version.js";
import { getWorkerOptions } from "../utils/worker.js";

import type { GetCustomComponentClassesRequest, GetCustomComponentClassesResponse } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


const workerPath = getWorkerPath();
const version = getTailwindcssVersion();
const workerOptions = getWorkerOptions();

const getCustomComponentClassesSync = createSyncFn<(version: SupportedTailwindVersion, request: GetCustomComponentClassesRequest) => any>(workerPath, workerOptions);


export function getCustomComponentClasses(request: GetCustomComponentClassesRequest): GetCustomComponentClassesResponse {
  if(!isSupportedVersion(version.major)){
    throw new Error(`Unsupported Tailwind CSS version: ${version.major}`);
  }

  return getCustomComponentClassesSync(version.major, request) as GetCustomComponentClassesResponse;
}


function getWorkerPath() {
  return resolve(getCurrentDirectory(), "./custom-component-classes.async.js");
}

function getCurrentDirectory() {
  // eslint-disable-next-line eslint-plugin-typescript/prefer-ts-expect-error
  // @ts-ignore - `import.meta` doesn't exist in CommonJS -> will be transformed in build step
  return import.meta.dirname;
}
