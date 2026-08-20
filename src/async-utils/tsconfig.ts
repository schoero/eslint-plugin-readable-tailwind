import { resolve } from "node:path";

import { withCache } from "./cache.js";
import { findPathRecursive } from "./fs.js";

import type { Warning } from "../types/async.js";


export interface GetTSConfigRequest {
  configPath: string | undefined;
  cwd: string;
}

export interface GetTSConfigResponse {
  path: string | undefined;
  warnings: (Warning | undefined)[];
}

export const getTSConfigPath = ({ configPath, cwd }: GetTSConfigRequest): GetTSConfigResponse => withCache(`tsconfig-path-${cwd}`, configPath, () => {

  const potentialPaths = [
    ...configPath ? [configPath] : [],
    "tsconfig.json",
    "jsconfig.json"
  ];

  const foundConfigPath = findPathRecursive(cwd, cwd, potentialPaths);
  const warning = getConfigPathWarning(configPath, foundConfigPath);

  return {
    path: foundConfigPath,
    warnings: [warning]
  };

});

function getConfigPathWarning(configPath: string | undefined, foundConfigPath: string | undefined): Warning | undefined {
  if(!configPath){
    return;
  }

  if(foundConfigPath && resolve(configPath) === resolve(foundConfigPath)){
    return;
  }

  return {
    option: "tsconfig",
    title: `No tsconfig found at \`${configPath}\``
  };
}
