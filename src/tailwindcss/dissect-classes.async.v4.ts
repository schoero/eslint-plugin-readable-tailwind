import { CachedStore, CacheTag } from "better-tailwindcss:utils/cached-store.js";

import { escapeForRegex } from "../async-utils/escape.js";
import { getCachedRegex } from "../async-utils/regex.js";
import { segment } from "../async-utils/segment.js";
import { getPrefix } from "./prefix.async.v4.js";

import type { DissectedClass, DissectedClasses } from "./dissect-classes.js";


export const getDissectedClasses = (tailwindContext: any, classes: string[]): DissectedClasses => CachedStore.getOrCreate(
  ["dissected-classes", ...classes],
  () => {

    const prefix = getPrefix(tailwindContext);
    const separator = ":";

    return classes.reduce<Record<string, DissectedClass>>((acc, className) => {
      const splitChunks = segment(className, separator);
      const variants = splitChunks
        .slice(0, -1)
        .filter((variant, index) => {
          if(variant === prefix && index === 0){
            return false;
          }
          return true;
        });

      let base = className
        .replace(getCachedRegex(`^${escapeForRegex(prefix + separator)}`), "")
        .replace(getCachedRegex(`^${escapeForRegex((variants?.join(separator) ?? "") + separator)}`), "");

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
  { tags: [CacheTag.CONTEXT] }
);
