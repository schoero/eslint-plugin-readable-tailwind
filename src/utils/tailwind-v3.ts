import defaultConfig from "tailwindcss3/defaultConfig.js";
import setupContextUtils from "tailwindcss3/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss3/loadConfig.js";
import resolveConfig from "tailwindcss3/resolveConfig.js";

import { resolve } from "readable-tailwind:utils:utils.js";


const CACHE = new Map<
  string | undefined,
  ReturnType<typeof setupContextUtils.createContext>
>();

export function initializeTailwindConfig(cwd: string, configPath?: string) {
  const cacheKey = getCacheKey(cwd, configPath);

  if(CACHE.has(cacheKey)){
    return;
  }

  const resolvedConfigPath = findTailwindConfig(cwd, configPath);
  const config = loadTailwindConfig(resolvedConfigPath);
  const context = createTailwindContext(config);

  CACHE.set(cacheKey, context);
}

export function getClassOrder(cwd: string, configPath: string | undefined, classes: string[]) {
  const cacheKey = getCacheKey(cwd, configPath);

  if(!CACHE.has(cacheKey)){
    initializeTailwindConfig(cwd, configPath);
  }

  return CACHE.get(cacheKey)!.getClassOrder(classes);
}

function getCacheKey(cwd: string, configPath?: string) {
  return JSON.stringify({ config: configPath, cwd });
}

function findTailwindConfig(cwd: string, configPath?: string) {

  let userConfig: string | undefined;

  userConfig ??= configPath
    ? resolve(cwd, configPath)
    : undefined;

  userConfig ??= resolve(cwd, "tailwind.config.js");
  userConfig ??= resolve(cwd, "tailwind.config.ts");

  if(userConfig){
    return userConfig;
  }

  const parentDirectory = resolve(cwd, "..");

  if(cwd === parentDirectory){
    return;
  }

  return findTailwindConfig(cwd, parentDirectory);

}

export function loadTailwindConfig(configPath?: string) {
  try {
    if(configPath){
      const config = loadConfig(configPath);
      return resolveConfig(config);
    }
  } catch (error){}

  return resolveConfig(defaultConfig);

}

function createTailwindContext(tailwindConfig: ReturnType<typeof resolveConfig>) {
  return setupContextUtils.createContext(tailwindConfig);
}
