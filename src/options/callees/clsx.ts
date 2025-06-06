import { MatcherType } from "better-tailwindcss:types/rule.js";

import type { CalleeMatchers, Callees } from "better-tailwindcss:types/rule.js";


export const CLSX_STRINGS = [
  "clsx",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const CLSX_OBJECT_KEYS = [
  "clsx",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/lukeed/clsx */
export const CLSX = [
  CLSX_STRINGS,
  CLSX_OBJECT_KEYS
] satisfies Callees;
