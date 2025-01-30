import { readFile } from "node:fs/promises";
import path, { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import postcss from "postcss";
import postcssImport from "postcss-import";

import { isCommonJSModule } from "../utils/module.js";
import { isWindows } from "../utils/platform.js";
import { cjsResolver, cssResolver, esmResolver } from "../utils/resolvers.js";


function resolveJsFrom(base: string, id: string): string {
  try {
    return esmResolver.resolveSync({}, base, id) || id;
  } catch (err){
    return cjsResolver.resolveSync({}, base, id) || id;
  }
}

function resolveCssFrom(base: string, id: string) {
  return cssResolver.resolveSync({}, base, id) || id;
}

function createLoader<T>({
  filepath,
  legacy,
  onError
}: {
  filepath: string;
  legacy: boolean;
  onError: (id: string, error: unknown, resourceType: string) => T;
}) {
  const cacheKey = `${+Date.now()}`;

  async function loadFile(id: string, base: string, resourceType: string) {
    try {
      const resolved = resolveJsFrom(base, id);

      const url = isWindows() ? pathToFileURL(resolved) : new URL(resolved);
      url.searchParams.append("t", cacheKey);

      return await import(url.href).then(m => m.default ?? m);
    } catch (err){
      return onError(id, err, resourceType);
    }
  }

  if(legacy){
    const baseDir = path.dirname(filepath);
    return async (id: string) => loadFile(id, baseDir, "module");
  }

  return async (id: string, base: string, resourceType: string) => {
    return {
      base,
      module: await loadFile(id, base, resourceType)
    };
  };
}

const CACHE = new Map<string, Awaited<ReturnType<typeof createTailwindContextFromEntryPoint>>>();

export async function createTailwindContextFromEntryPoint(entryPoint: string) {
  if(CACHE.has(entryPoint)){
    return CACHE.get(entryPoint);
  }

  const importBasePath = dirname(entryPoint);

  const tailwindPath = isCommonJSModule()
    ? cjsResolver.resolveSync({}, importBasePath, "tailwindcss")
    : esmResolver.resolveSync({}, importBasePath, "tailwindcss");

  if(!tailwindPath){
    throw new Error("Could not find Tailwind CSS");
  }

  const tailwindUrl = isWindows() ? pathToFileURL(tailwindPath).toString() : tailwindPath;

  // eslint-disable-next-line eslint-plugin-typescript/naming-convention
  const { __unstable__loadDesignSystem } = await import(tailwindUrl);

  let css = await readFile(entryPoint, "utf-8");

  // Determine if the v4 API supports resolving `@import`
  let supportsImports = false;
  try {
    await __unstable__loadDesignSystem('@import "./empty";', {
      loadStylesheet: async () => {
        supportsImports = true;
        return {
          base: importBasePath,
          content: ""
        };
      }
    });
  } catch {}

  if(!supportsImports){
    const resolveImports = postcss([postcssImport()]);
    const result = await resolveImports.process(css, { from: entryPoint });
    css = result.css;
  }

  // Load the design system and set up a compatible context object that is
  // usable by the rest of the plugin
  const design = await __unstable__loadDesignSystem(css, {
    base: importBasePath,
    loadModule: createLoader({
      filepath: entryPoint,
      legacy: false,
      onError: (id, err, resourceType) => {
        console.error(`Unable to load ${resourceType}: ${id}`, err);

        if(resourceType === "config"){
          return {};
        } else if(resourceType === "plugin"){
          return () => {};
        }
      }
    }),

    loadStylesheet: async (id: string, base: string) => {
      const resolved = resolveCssFrom(base, id);

      return {
        base: path.dirname(resolved),
        content: await readFile(resolved, "utf-8")
      };
    }
  });

  const context = {
    getClassOrder: (classList: string[]) => design.getClassOrder(classList)
  };

  CACHE.set(entryPoint, context);

  return context;
}
