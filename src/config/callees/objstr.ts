import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const OBJSTR_STRINGS = [
  "objstr",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const OBJSTR_OBJECT_KEYS = [
  "objstr",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/lukeed/obj-str */
export const OBJSTR = [
  OBJSTR_OBJECT_KEYS
] satisfies Callees;
