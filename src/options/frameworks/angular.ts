import { HTML } from "better-tailwindcss:options/frameworks/html.js";
import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { AttributeSelector, Selectors } from "better-tailwindcss:types/rule.js";


export const ANGULAR_CLASS_BINDING_ATTRIBUTE = {
  kind: SelectorKind.Attribute,
  name: "(?:^\\[class\\]$)|(?:^\\[ngClass\\]$)"
} satisfies AttributeSelector;

export const ANGULAR_CLASS_BINDING_ATTRIBUTE_STRINGS_AND_OBJECT_KEYS = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.String
    },
    {
      type: MatcherType.ObjectKey
    }
  ],
  name: "(?:^\\[class\\]$)|(?:^\\[ngClass\\]$)"
} satisfies AttributeSelector;

export const ANGULAR_SINGLE_CLASS_BINDING_ATTRIBUTE = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.String
    }
  ],
  name: "(?:^\\[class\\..*\\]$)"
} satisfies AttributeSelector;

/** @see https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings */
export const ANGULAR = [
  ...HTML,
  ANGULAR_CLASS_BINDING_ATTRIBUTE,
  ANGULAR_CLASS_BINDING_ATTRIBUTE_STRINGS_AND_OBJECT_KEYS,
  ANGULAR_SINGLE_CLASS_BINDING_ATTRIBUTE
] satisfies Selectors;
