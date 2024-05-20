import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const CX_STRINGS = [
  "cx",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const CX_OBJECT_KEYS = [
  "cx",
  [
    {
      match: MatcherType.ObjectKey
    }
  ]
] satisfies CalleeMatchers;

/** @see https://cva.style/docs/api-reference#cx */
export const CX = [
  CX_STRINGS,
  CX_OBJECT_KEYS
] satisfies Callees;
