import { CachedStore, CacheEntry } from "../async-utils/cached-store.js";
import { escapeForRegex } from "../async-utils/escape.js";
import { getCachedRegex } from "../async-utils/regex.js";
import { segment } from "../async-utils/segment.js";
import { getPrefix } from "./prefix.async.v3.js";

import type { AsyncContext } from "../utils/context.js";
import type { DissectedClass, DissectedClasses } from "./dissect-classes.js";


export const getDissectedClasses = async (ctx: AsyncContext, tailwindContext: any, classes: string[]): Promise<DissectedClasses> => CachedStore.getOrCreate(
  ["dissected-classes", ...classes],
  () => {

    const prefix = getPrefix(tailwindContext);
    const separator = tailwindContext.tailwindConfig.separator ?? ":";

    return classes.reduce<Record<string, DissectedClass>>((acc, className) => {
      const splitChunks = segment(className, separator);
      const variants = splitChunks.slice(0, -1);

      let base = className
        .replace(new RegExp(`^${escapeForRegex(variants.join(separator) + separator)}`), "")
        .replace(new RegExp(`^${escapeForRegex(prefix)}`), "");

      const isNegative = base.startsWith("-");
      base = base.replace(getCachedRegex(/^-/), "");

      const isImportantAtStart = base.startsWith("!");
      base = base.replace(getCachedRegex(/^!/), "");

      const isImportantAtEnd = base.endsWith("!");
      base = base.replace(getCachedRegex(/!$/), "");

      acc[className] = {
        base,
        className,
        important: [isImportantAtStart, isImportantAtEnd],
        negative: isNegative,
        prefix,
        separator,
        variants
      };

      return acc;
    }, {});
  },
  { dependencies: [CacheEntry.TAILWIND_CONTEXT] }
);
