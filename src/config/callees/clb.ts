import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const CLB_BASE_VALUES = [
  "clb",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^base$"
    }
  ]
] satisfies CalleeMatchers;

export const CLB_VARIANT_VALUES = [
  "clb",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^variants.*$"
    }
  ]
] satisfies CalleeMatchers;

export const CLB_COMPOUND_VARIANTS_CLASSES = [
  "clb",
  [
    {
      match: MatcherType.ObjectValue,
      pathPattern: "^compoundVariants\\[\\d+\\]\\.classes$"
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/crswll/clb */
export const CLB = [
  CLB_BASE_VALUES,
  CLB_VARIANT_VALUES,
  CLB_COMPOUND_VARIANTS_CLASSES
  // TODO: add object key matcher: classes
] satisfies Callees;
