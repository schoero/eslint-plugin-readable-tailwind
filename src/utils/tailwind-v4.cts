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
  const code = fs.readFileSync(tailwindThemePath);

  const result = lightningcss.transform({
    analyzeDependencies: true,
    code,
    customAtRules: {
      // apply: {
      //   body: "declaration-list"
      // },
      // theme: {
      //   body: "style-block"
      // }
    },
    drafts: {
      customMedia: true
    },
    errorRecovery: true,
    filename: tailwindThemePath,
    include: lightningcss.Features.Nesting,
    nonStandard: {
      deepSelectorCombinator: true
    },
    targets: {
      safari: 16 << 16 | 4 << 8
    }
  });

  for(const warning of result.warnings){
    console.warn(warning);
  }

  if(!result.dependencies){
    return tailwindcss.__unstable__loadDesignSystem(result.code.toString());
  }

  const dirname = path.dirname(tailwindThemePath);

  const sortedDependencies = result.dependencies.sort((a, b) => {
    return a.loc.start.line - b.loc.start.line;
  });

  const lines = result.code.toString().split("\n");

  let insertLineOffset: number = 0;

  const insertCode = (code: string) => {
    const insertLines = code.split("\n");
    lines.splice(insertLineOffset, 0, ...insertLines);
    insertLineOffset += insertLines.length;
  };

  for(const dependency of sortedDependencies){
    if(dependency.type !== "import"){
      console.warn(
        "Dependency not resolved",
        dependency,
        "Please report this issue at https://github.com/schoero/eslint-plugin-readable-tailwind/issues"
      );
      continue;
    }

    if(dependency.url === "tailwindcss"){
      const resolved = tailwind.resolve(dirname, "tailwindcss/theme.css");

      if(!resolved){
        throw new Error("Could not resolve Tailwind dependency");
      }

      const importedCode = fs.readFileSync(resolved, "utf-8");

      insertCode(importedCode);

      continue;

    }

    const resolved = tailwind.resolve(dirname, dependency.url);

    if(!resolved){
      console.warn("Could not resolve dependency", dependency.url);
      continue;
    }

    const importedCode = fs.readFileSync(resolved, "utf-8");

    insertCode(importedCode);

  }

  return tailwindcss.__unstable__loadDesignSystem(lines.join("\n"));

}
