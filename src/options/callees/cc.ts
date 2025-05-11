import { MatcherType } from "better-tailwindcss:types:rule.js";

import type { CalleeMatchers, Callees } from "better-tailwindcss:types:rule.js";


export const CC_STRINGS = [
  "cc",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const CC_OBJECT_KEYS = [
  "cc",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/jorgebucaran/classcat */
export const CC = [
  CC_STRINGS,
  CC_OBJECT_KEYS
] satisfies Callees;
