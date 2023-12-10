/* eslint-disable @typescript-eslint/naming-convention */
import { jsxAttributeExpression } from "eptm:rules:jsx-attribute-expression.js";
import { tailwindMultiline } from "eptm:rules:tailwind-multiline.js";
import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindSortClasses } from "eptm:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


export default {
  configs: {
    "recommended/error": {
      plugins: ["readable-tailwind"],
      rules: {
        [jsxAttributeExpression.name]: "error",
        [tailwindNoUnnecessaryWhitespace.name]: "error",
        [tailwindSortClasses.name]: "error",
        [tailwindMultiline.name]: "error"
      }
    },
    "recommended/warn": {
      plugins: ["readable-tailwind"],
      rules: {
        [jsxAttributeExpression.name]: "warn",
        [tailwindNoUnnecessaryWhitespace.name]: "warn",
        [tailwindSortClasses.name]: "warn",
        [tailwindMultiline.name]: "warn"
      }
    }
  },
  rules: {
    [jsxAttributeExpression.name]: jsxAttributeExpression.rule,
    [tailwindNoUnnecessaryWhitespace.name]: tailwindNoUnnecessaryWhitespace.rule,
    [tailwindSortClasses.name]: tailwindSortClasses.rule,
    [tailwindMultiline.name]: tailwindMultiline.rule
  }
} satisfies ESLint.Plugin;
