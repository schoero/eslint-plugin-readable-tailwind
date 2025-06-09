import defaultConfig from "tailwindcss3/defaultConfig.js";
import * as setupContextUtils from "tailwindcss3/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss3/loadConfig.js";
import resolveConfig from "tailwindcss3/resolveConfig.js";

import { withCache } from "../utils/cache.js";


export function loadTailwindConfig(path: string) {
  const config = path === "default"
    ? defaultConfig
    : loadConfig(path);

  return resolveConfig(config);
}

export const createTailwindContextFromConfigFile = async (path: string = "default") => withCache(path, async () => {
  const tailwindConfig = loadTailwindConfig(path);

  return setupContextUtils.createContext?.(tailwindConfig) ?? setupContextUtils.default?.createContext?.(tailwindConfig);
});
