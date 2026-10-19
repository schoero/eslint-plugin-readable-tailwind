import { CachedStore, CacheTag } from "../async-utils/cached-store.js";
import { normalize } from "../async-utils/path.js";

import type { AsyncContext } from "../utils/context.js";


let tailwindContext: Awaited<ReturnType<typeof buildTailwindContext>>;

export async function createTailwindContext(ctx: AsyncContext) {
  const options = {
    paths: [ctx.cwd, ctx.installation, ...ctx.tailwindConfigPath === "default" ? [] : [ctx.tailwindConfigPath], ...ctx.tsconfigPath ? [ctx.tsconfigPath] : []],
    tags: [CacheTag.CWD, CacheTag.TS_CONFIG]
  };

  if(tailwindContext !== undefined && CachedStore.isValid("tailwind-context-v3", options)){
    return tailwindContext;
  }

  const context = await buildTailwindContext(ctx);
  CachedStore.getOrCreate("tailwind-context-v3", () => true, options);
  tailwindContext = context;
  return context;
}

async function buildTailwindContext(ctx: AsyncContext) {
  CachedStore.invalidateTag(CacheTag.CONTEXT);

  const { default: defaultConfig } = await import(normalize(`${ctx.installation}/defaultConfig.js`));
  const setupContextUtils = await import(normalize(`${ctx.installation}/lib/lib/setupContextUtils.js`));
  const { default: loadConfig } = await import(normalize(`${ctx.installation}/loadConfig.js`));
  const { default: resolveConfig } = await import(normalize(`${ctx.installation}/resolveConfig.js`));

  const config = resolveConfig(
    ctx.tailwindConfigPath === "default"
      ? defaultConfig
      : loadConfig(ctx.tailwindConfigPath)
  );

  return setupContextUtils.createContext?.(config) ?? setupContextUtils.default?.createContext?.(config);
}
