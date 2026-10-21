import { HTML } from "better-tailwindcss:options/frameworks/html.js";
import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { AttributeSelector, Selectors } from "better-tailwindcss:types/rule.js";


export const ASTRO_CLASS_LIST_ATTRIBUTE = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.String
    },
    {
      type: MatcherType.ObjectKey
    }
  ],
  name: "^class:list$"
} satisfies AttributeSelector;

/** @see https://docs.astro.build/en/reference/directives-reference/#classlist */
export const ASTRO = [
  ...HTML,
  ASTRO_CLASS_LIST_ATTRIBUTE
] satisfies Selectors;
