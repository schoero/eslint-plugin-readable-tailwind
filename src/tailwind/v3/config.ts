import defaultConfig from "tailwindcss3/defaultConfig.js";
import setupContextUtils from "tailwindcss3/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss3/loadConfig.js";
import resolveConfig from "tailwindcss3/resolveConfig.js";


export function loadTailwindConfig(path: string | undefined) {
  const config = path ? loadConfig(path) : defaultConfig;
  return resolveConfig(config);
}

const CACHE = new Map<string, ReturnType<typeof setupContextUtils.createContext>>();

export function createTailwindContextFromConfigFile(path: string = "default") {
  if(CACHE.has(path)){
    console.log("v3 cached designSystem");
    return CACHE.get(path);
  }

  const tailwindConfig = loadTailwindConfig(path);
  const context = setupContextUtils.createContext?.(tailwindConfig) ?? setupContextUtils.default?.createContext?.(tailwindConfig);

  CACHE.set(path, context);

  return context;
}
