import { CachedStore, CacheTag } from "../async-utils/cached-store.js";

import type { UnknownClass } from "./unknown-classes.js";


export function getUnknownClasses(tailwindContext: any, classes: string[]): UnknownClass[] {
  return CachedStore.getOrCreate(
    ["unknown-classes-response", ...classes],
    () => {
      const css = tailwindContext.candidatesToCss(classes);
      return classes.filter((_, index) => css.at(index) === null);
    },
    { tags: [CacheTag.CONTEXT] }
  );
}
