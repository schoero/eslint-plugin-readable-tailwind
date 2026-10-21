import { CachedStore, CacheEntry } from "../async-utils/cached-store.js";
import { normalize } from "../async-utils/path.js";

import type { AsyncContext } from "../utils/context.js";
import type { UnknownClass } from "./unknown-classes.js";


export async function getUnknownClasses(ctx: AsyncContext, tailwindContext: any, classes: string[]): Promise<UnknownClass[]> {
  const rules = await import(normalize(`${ctx.installation}/lib/lib/generateRules.js`));

  const unknown = CachedStore.getOrCreateEach(
    classes.map(className => ["unknown-class", className]),
    missing => missing.map(index => {
      const generated = rules.generateRules?.([classes[index]], tailwindContext) ?? rules.default?.generateRules?.([classes[index]], tailwindContext);

      return generated.length === 0;
    }),
    { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
  );

  return classes.filter((_, index) => unknown[index]);
}
