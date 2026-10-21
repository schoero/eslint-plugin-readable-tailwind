import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { createJiti } from "jiti";

import { CachedStore, CacheEntry } from "../async-utils/cached-store.js";
import { flattenCssImportTree, getCssImportTree, parseCssFileWithTree } from "../async-utils/css-import-tree.js";
import { normalize } from "../async-utils/path.js";
import { resolveCss, resolveJs } from "../async-utils/resolvers.js";

import type { AsyncContext } from "../utils/context.js";


let tailwindContext: Awaited<ReturnType<typeof buildTailwindContext>>;

export async function createTailwindContext(ctx: AsyncContext) {
  if(tailwindContext !== undefined && CachedStore.has(CacheEntry.TAILWIND_CONTEXT)){
    return tailwindContext;
  }

  // a new entry makes everything derived from the previous context stale
  CachedStore.delete(CacheEntry.TAILWIND_CONTEXT);

  const imports = flattenCssImportTree(getCssImportTree(ctx, ctx.tailwindConfigPath, parseCssFileWithTree));

  await CachedStore.getOrCreate(
    CacheEntry.TAILWIND_CONTEXT,
    async () => {
      tailwindContext = await buildTailwindContext(ctx);
      return true;
    },
    {
      dependencies: [CacheEntry.TAILWIND_CONFIG_PATH, CacheEntry.TSCONFIG_PATH, CacheEntry.TAILWIND_VERSION],
      paths: [ctx.tailwindConfigPath, ...imports, ...ctx.tsconfigPath ? [ctx.tsconfigPath] : []]
    }
  );

  return tailwindContext;
}

async function buildTailwindContext(ctx: AsyncContext) {
  const css = CachedStore.readFile(ctx.tailwindConfigPath);

  const jiti = createJiti(getCurrentFilename(), {
    fsCache: false,
    moduleCache: false
  });

  const importBasePath = dirname(ctx.tailwindConfigPath);
  const tailwindPath = resolveJs(ctx, "tailwindcss", importBasePath);

  // eslint-disable-next-line eslint-plugin-typescript/naming-convention
  const { __unstable__loadDesignSystem } = await import(normalize(tailwindPath));

  return __unstable__loadDesignSystem(css, {
    base: importBasePath,
    loadModule: createLoader(ctx, jiti, {
      filepath: ctx.tailwindConfigPath,
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
      try {
        const resolved = resolveCss(ctx, id, base);

        return {
          base: dirname(resolved),
          content: readFileSync(resolved, "utf-8")
        };
      } catch {
        return {
          base: "",
          content: ""
        };
      }
    }
  });
}

function createLoader<T>(ctx: AsyncContext, jiti: ReturnType<typeof createJiti>, {
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
      const resolved = resolveJs(ctx, id, base);

      const url = pathToFileURL(resolved);
      url.searchParams.append("t", cacheKey);

      return await jiti.import(url.href, { default: true });
    } catch (err){
      return onError(id, err, resourceType);
    }
  }

  if(legacy){
    const baseDir = dirname(filepath);
    return async (id: string) => loadFile(id, baseDir, "module");
  }

  return async (id: string, base: string, resourceType: string) => {
    return {
      base,
      module: await loadFile(id, base, resourceType)
    };
  };
}

function getCurrentFilename() {
  // eslint-disable-next-line eslint-plugin-typescript/prefer-ts-expect-error
  // @ts-ignore - `import.meta` doesn't exist in CommonJS -> will be transformed in build step
  return import.meta.url;
}
