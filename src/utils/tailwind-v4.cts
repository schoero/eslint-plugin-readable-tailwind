import tailwind = require("readable-tailwind:utils:tailwind.cjs");
import fs = require("fs");
import path = require("path");
import lightningcss = require("lightningcss");


const tailwindcss = require("tailwindcss4");


const CACHE = new Map<
  string | undefined,
  ReturnType<typeof loadTailwindTheme>
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

function initializeTailwindConfig(cwd: string, themePath?: string): void {
  const cacheKey = getCacheKey(cwd, themePath);

  if(CACHE.has(cacheKey)){
    return;
  }

  const resolvedConfigPath = findTailwindTheme(cwd, themePath);
  const theme = loadTailwindTheme(resolvedConfigPath);

  CACHE.set(cacheKey, theme);
}

function findTailwindTheme(cwd: string, themePath?: string) {

  let userTheme: string | undefined;

  userTheme ??= themePath
    ? tailwind.resolve(cwd, themePath)
    : undefined;

  userTheme ??= tailwind.resolve(cwd, "tailwindcss/theme.css");

  if(userTheme){
    return userTheme;
  }

  throw new Error("Could not find a Tailwind theme file.");

}

function loadTailwindTheme(tailwindThemePath: string) {
  // https://github.com/tailwindlabs/prettier-plugin-tailwindcss/blob/3c9ce4e488c09851be1d5be37940b39679e10c1c/src/config.js#L180

  console.log("Loading Tailwind theme from", tailwindThemePath);

  const dirname = path.dirname(tailwindThemePath);

  const result = lightningcss.bundle({
    analyzeDependencies: false,
    // customAtRules: {
    // apply: {
    //   body: "declaration-list"
    // },
    // theme: {
    //   body: "style-block"
    // }
    // },
    drafts: {
      customMedia: true
    },
    errorRecovery: true,
    filename: tailwindThemePath,
    include: lightningcss.Features.Nesting,
    nonStandard: {
      deepSelectorCombinator: true
    },
    projectRoot: dirname,
    visitor: {
      Rule: {
        import: rule => {
          console.log("Import", rule);

          if(rule.value.url === "tailwindcss"){
            const resolved = tailwind.resolve(dirname, "tailwindcss/theme.css");
            if(resolved){
              rule.value.url = resolved;
            }
          }

          if(rule.value.url.startsWith(".") || rule.value.url.startsWith("/")){
            const resolved = tailwind.resolve(dirname, rule.value.url);
            if(resolved){
              rule.value.url = resolved;
            }
          }
          return rule;
        }
      }
    }
  });

  for(const warning of result.warnings){
    console.warn(warning);
  }

  return tailwindcss.__unstable__loadDesignSystem(result.code.toString());

}
