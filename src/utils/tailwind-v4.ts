import { bundle } from "lightningcss";
import { __unstable__loadDesignSystem } from "tailwindcss4";

import { resolve } from "readable-tailwind:utils:utils.js";


const CACHE = new Map<
  string | undefined,
  (classes: string[]) => [className: string, order: bigint | null][]
>();

export function initializeTailwindConfig(cwd: string, themePath?: string) {
  const cacheKey = getCacheKey(cwd, themePath);

  if(CACHE.has(cacheKey)){
    return CACHE.get(cacheKey)!;
  }

  const resolvedConfigPath = findTailwindTheme(cwd, themePath);
  const theme = loadTailwindTheme(resolvedConfigPath);

  CACHE.set(cacheKey, theme.getClassOrder);
}

export function getClassOrder(cwd: string, configPath: string | undefined, classes: string[]) {
  const cacheKey = getCacheKey(cwd, configPath);

  if(!CACHE.has(cacheKey)){
    initializeTailwindConfig(cwd, configPath);
  }

  return CACHE.get(cacheKey)!(classes);
}

function getCacheKey(cwd: string, configPath?: string) {
  return JSON.stringify({ config: configPath, cwd });
}


function findTailwindTheme(cwd: string, themePath?: string) {

  let userTheme: string | undefined;

  userTheme ??= themePath
    ? resolve(cwd, themePath)
    : undefined;

  userTheme ??= resolve(cwd, "tailwindcss/theme.css");

  if(userTheme){
    return userTheme;
  }

  throw new Error("Could not find a Tailwind theme file.");

}

function loadTailwindTheme(path: string) {

  // https://github.com/tailwindlabs/prettier-plugin-tailwindcss/blob/3c9ce4e488c09851be1d5be37940b39679e10c1c/src/config.js#L180

  const result = bundle({ filename: path });

  return __unstable__loadDesignSystem(result.code.toString());
}
