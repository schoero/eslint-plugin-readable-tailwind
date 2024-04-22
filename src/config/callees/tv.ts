import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const TV_STRINGS = [
  "tv",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

export const TV_VARIANT_VALUES = [
  "tv",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^variants.*$"
    }
  ]
] satisfies CalleeMatchers;

export const TV_COMPOUND_VARIANTS_CLASS = [
  "tv",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/nextui-org/tailwind-variants?tab=readme-ov-file */
export const TV = [
  TV_STRINGS,
  TV_VARIANT_VALUES,
  TV_COMPOUND_VARIANTS_CLASS
] satisfies Callees;
