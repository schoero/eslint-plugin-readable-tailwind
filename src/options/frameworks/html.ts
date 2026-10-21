import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { AttributeSelector, Selectors } from "better-tailwindcss:types/rule.js";


export const HTML_CLASS_ATTRIBUTE = {
  kind: SelectorKind.Attribute,
  name: "^class$"
} satisfies AttributeSelector;

export const HTML_CLASS_ATTRIBUTE_STRINGS = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.String
    }
  ],
  name: "^class$"
} satisfies AttributeSelector;

/** @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/class */
export const HTML = [
  HTML_CLASS_ATTRIBUTE,
  HTML_CLASS_ATTRIBUTE_STRINGS
] satisfies Selectors;
