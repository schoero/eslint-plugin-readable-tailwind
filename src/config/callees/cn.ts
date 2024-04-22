import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


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

/** @see https://github.com/lukeed/cn */
export const CN = [
  CN_STRINGS,
  CN_OBJECT_KEYS
] satisfies Callees;
