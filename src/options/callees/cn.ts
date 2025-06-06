import { MatcherType } from "better-tailwindcss:types/rule.js";

import type { CalleeMatchers, Callees } from "better-tailwindcss:types/rule.js";


export const CN_STRINGS = [
  "cn",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const CN_OBJECT_KEYS = [
  "cn",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://ui.shadcn.com/docs/installation/manual */
export const CN = [
  CN_STRINGS,
  CN_OBJECT_KEYS
] satisfies Callees;
