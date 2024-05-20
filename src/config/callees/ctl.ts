import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeMatchers, Callees } from "readable-tailwind:types:rule.js";


export const CTL_STRINGS = [
  "ctl",
  [
    {
      match: MatcherType.String
    }
  ]
] satisfies CalleeMatchers;

/** @see https://github.com/netlify/classnames-template-literals */
export const CTL = [
  CTL_STRINGS
] satisfies Callees;
