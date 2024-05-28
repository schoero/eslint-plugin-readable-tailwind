import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const CVA_STRINGS = [
  "cva",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const CVA_VARIANT_VALUES = [
  "cva",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^variants.*$"
    }
  ]
] satisfies CalleeMatchers;

export const CVA_COMPOUND_VARIANTS_CLASS = [
  "cva",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/joe-bell/cva */
export const CVA = [
  CVA_STRINGS,
  CVA_VARIANT_VALUES,
  CVA_COMPOUND_VARIANTS_CLASS
] satisfies Callees;
