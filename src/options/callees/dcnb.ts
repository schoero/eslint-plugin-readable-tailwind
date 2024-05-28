import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const DCNB_STRINGS = [
  "dcnb",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const DCNB_OBJECT_KEYS = [
  "dcnb",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/xobotyi/cnbuilder */
export const DCNB = [
  DCNB_STRINGS,
  DCNB_OBJECT_KEYS
] satisfies Callees;
