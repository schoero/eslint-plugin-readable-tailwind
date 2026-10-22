import { CachedStore, CacheEntry } from "../async-utils/cached-store.js";

import type { UnknownClass } from "./unknown-classes.js";


export function getUnknownClasses(tailwindContext: any, classes: string[]): UnknownClass[] {
  const unknown = CachedStore.getOrCreateEach(
    classes.map(className => ["unknown-class", className]),
    missing => {
      const css = tailwindContext.candidatesToCss(missing.map(index => classes[index]));
      return missing.map((_, position) => css.at(position) === null);
    },
    { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
  );

  return classes.filter((_, index) => unknown[index]);
}
