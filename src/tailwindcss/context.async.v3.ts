import { CachedStore, CacheEntry } from "../async-utils/cached-store.js";
import { normalize } from "../async-utils/path.js";

import type { AsyncContext } from "../utils/context.js";


// the context is not serializable, it stays in the worker and the cache entry only tracks whether it is still valid
let tailwindContext: Awaited<ReturnType<typeof buildTailwindContext>>;

export async function createTailwindContext(ctx: AsyncContext) {
  if(tailwindContext !== undefined && CachedStore.has(CacheEntry.TAILWIND_CONTEXT)){
    return tailwindContext;
  }

  // a new entry makes everything derived from the previous context stale
  CachedStore.delete(CacheEntry.TAILWIND_CONTEXT);

  await CachedStore.getOrCreate(
    CacheEntry.TAILWIND_CONTEXT,
    async () => {
      tailwindContext = await buildTailwindContext(ctx);
      return true;
    },
    {
      dependencies: [CacheEntry.TAILWIND_CONFIG_PATH, CacheEntry.TSCONFIG_PATH, CacheEntry.TAILWIND_VERSION],
      paths: [...ctx.tailwindConfigPath === "default" ? [] : [ctx.tailwindConfigPath], ...ctx.tsconfigPath ? [ctx.tsconfigPath] : []]
    }
  );

  return tailwindContext;
}

async function buildTailwindContext(ctx: AsyncContext) {
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
