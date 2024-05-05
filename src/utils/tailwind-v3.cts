import tailwind = require("readable-tailwind:utils:tailwind.cjs");
import defaultConfig = require("tailwindcss3/defaultConfig.js");
import setupContextUtils = require("tailwindcss3/lib/lib/setupContextUtils.js");
import loadConfig = require("tailwindcss3/loadConfig.js");
import resolveConfig = require("tailwindcss3/resolveConfig.js");


const CACHE = new Map<
  string | undefined,
  any
>();


export = function getClassOrder(cwd: string, configPath: string | undefined, classes: string[]) {
  const cacheKey = getCacheKey(cwd, configPath);

  if(!CACHE.has(cacheKey)){
    initializeTailwindConfig(cwd, configPath);
  }

  return CACHE.get(cacheKey)!.getClassOrder(classes);
};

function getCacheKey(cwd: string, configPath?: string) {
  return JSON.stringify({ config: configPath, cwd });
}

function initializeTailwindConfig(cwd: string, configPath?: string) {
  const cacheKey = getCacheKey(cwd, configPath);

  if(CACHE.has(cacheKey)){
    return;
  }

  const resolvedConfigPath = findTailwindConfig(cwd, configPath);
  const config = loadTailwindConfig(resolvedConfigPath);
  const context = createTailwindContext(config);

  CACHE.set(cacheKey, context);
}

function findTailwindConfig(cwd: string, configPath?: string) {

  let userConfig: string | undefined;

  userConfig ??= configPath
    ? tailwind.resolve(cwd, configPath)
    : undefined;

  userConfig ??= tailwind.resolve(cwd, "./tailwind.config.js");
  userConfig ??= tailwind.resolve(cwd, "./tailwind.config.ts");

  if(userConfig){
    return userConfig;
  }

  const parentDirectory = tailwind.resolve(cwd, "..");

  if(cwd === parentDirectory){
    return;
  }

  return findTailwindConfig(cwd, parentDirectory);

}

function loadTailwindConfig(configPath?: string) {
  try {
    if(configPath){
      const config = loadConfig(configPath);
      return resolveConfig(config);
    }
  } catch {}

  return resolveConfig(defaultConfig);

}

function createTailwindContext(tailwindConfig: ReturnType<typeof resolveConfig>) {
  return setupContextUtils.createContext(tailwindConfig);
}
