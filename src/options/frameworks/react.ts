import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { AttributeSelector, Selectors } from "better-tailwindcss:types/rule.js";


export const REACT_CLASS_NAME_ATTRIBUTE = {
  kind: SelectorKind.Attribute,
  name: "^className$"
} satisfies AttributeSelector;

export const REACT_CLASS_NAME_ATTRIBUTE_STRINGS = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.String
    }
  ],
  name: "^className$"
} satisfies AttributeSelector;

/** @see https://react.dev/reference/react-dom/components/common#applying-css-styles */
export const REACT = [
  REACT_CLASS_NAME_ATTRIBUTE,
  REACT_CLASS_NAME_ATTRIBUTE_STRINGS
] satisfies Selectors;
