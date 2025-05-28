import { MatcherType } from "better-tailwindcss:types:rule.js";

import type { CalleeMatchers, Callees } from "better-tailwindcss:types:rule.js";


export const CNB_STRINGS = [
  "cnb",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const CNB_OBJECT_KEYS = [
  "cnb",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/xobotyi/cnbuilder */
export const CNB = [
  CNB_STRINGS,
  CNB_OBJECT_KEYS
] satisfies Callees;
