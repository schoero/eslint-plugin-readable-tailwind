import { MatcherType } from "better-tailwindcss:types/rule.js";

import type { CalleeMatchers, Callees } from "better-tailwindcss:types/rule.js";


export const TW_JOIN_STRINGS = [
  "twJoin",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/dcastil/tailwind-merge */
export const TW_JOIN = [
  TW_JOIN_STRINGS
] satisfies Callees;
