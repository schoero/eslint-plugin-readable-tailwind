import { HTML } from "better-tailwindcss:options/frameworks/html.js";
import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { AttributeSelector, Selectors } from "better-tailwindcss:types/rule.js";


export const SOLID_CLASS_LIST_ATTRIBUTE_OBJECT_KEYS = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.ObjectKey
    }
  ],
  name: "^classList$"
} satisfies AttributeSelector;

/** @see https://docs.solidjs.com/reference/jsx-attributes/classlist */
export const SOLID = [
  ...HTML,
  SOLID_CLASS_LIST_ATTRIBUTE_OBJECT_KEYS
] satisfies Selectors;
