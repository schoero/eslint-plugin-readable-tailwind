import { jsxAttributeExpression } from "eptm:rules:jsx-attribute-expression.js";
import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindSortClasses } from "eptm:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


export default {
  rules: {
    [jsxAttributeExpression.name]: jsxAttributeExpression.rule,
    [tailwindNoUnnecessaryWhitespace.name]: tailwindNoUnnecessaryWhitespace.rule,
    [tailwindSortClasses.name]: tailwindSortClasses.rule
  }
} satisfies ESLint.Plugin;
