import { HTML } from "better-tailwindcss:options/frameworks/html.js";
import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { AttributeSelector, Selectors } from "better-tailwindcss:types/rule.js";


export const VUE_CLASS_BINDING_ATTRIBUTE = {
  kind: SelectorKind.Attribute,
  match: [
    {
      type: MatcherType.String
    },
    {
      type: MatcherType.ObjectKey
    }
  ],
  name: "^v-bind:class$"
} satisfies AttributeSelector;

/** @see https://vuejs.org/guide/essentials/class-and-style.html */
export const VUE = [
  ...HTML,
  VUE_CLASS_BINDING_ATTRIBUTE
] satisfies Selectors;
