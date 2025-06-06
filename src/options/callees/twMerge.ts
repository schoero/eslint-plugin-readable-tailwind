import { MatcherType } from "better-tailwindcss:types/rule.js";

import type { CalleeMatchers, Callees } from "better-tailwindcss:types/rule.js";


export const TW_MERGE_STRINGS = [
  "twMerge",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/dcastil/tailwind-merge */
export const TW_MERGE = [
  TW_MERGE_STRINGS
] satisfies Callees;
