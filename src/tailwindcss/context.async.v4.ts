import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { createJiti } from "jiti";

import { CachedStore, CacheTag } from "../async-utils/cached-store.js";
import { flattenCssImportTree, getCssImportTree, parseCssFileWithTree } from "../async-utils/css-import-tree.js";
import { normalize } from "../async-utils/path.js";
import { resolveCss, resolveJs } from "../async-utils/resolvers.js";

import type { AsyncContext } from "../utils/context.js";


let tailwindContext: Awaited<ReturnType<typeof buildTailwindContext>>;

export async function createTailwindContext(ctx: AsyncContext) {
  const css = CachedStore.readFile(ctx.tailwindConfigPath);

  const dependencies = await CachedStore.getOrCreate(["tailwind-context-dependencies", ctx.tailwindConfigPath], async () => {
    const imports = getCssImportTree(ctx, ctx.tailwindConfigPath, parseCssFileWithTree);
    return flattenCssImportTree(imports);
  }, { paths: [ctx.tailwindConfigPath] });

  const options = {
    paths: [ctx.cwd, ctx.installation, ctx.tailwindConfigPath, ...dependencies, ...ctx.tsconfigPath ? [ctx.tsconfigPath] : []],
    tags: [CacheTag.CWD, CacheTag.TS_CONFIG]
  };

  if(tailwindContext !== undefined && CachedStore.isValid("tailwind-context-v4", options)){
    return tailwindContext;
  }
  const context = await buildTailwindContext(ctx, css);
  CachedStore.getOrCreate("tailwind-context-v4", () => true, options);
  tailwindContext = context;
  return context;
}

async function buildTailwindContext(ctx: AsyncContext, css: string) {
  CachedStore.invalidateTag(CacheTag.CONTEXT);

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
