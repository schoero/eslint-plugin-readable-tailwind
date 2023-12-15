/* eslint-disable @typescript-eslint/naming-convention */
import { jsxAttributeExpression } from "eptm:rules:jsx-attribute-expression.js";
import { tailwindMultiline } from "eptm:rules:tailwind-multiline.js";
import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindSortClasses } from "eptm:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


const pluginName = "readable-tailwind";

export default {
  configs: {
    "recommended-error": {
      plugins: [pluginName],
      rules: {
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "error",
        [`${pluginName}/${jsxAttributeExpression.name}`]: "error",
        [`${pluginName}/${tailwindSortClasses.name}`]: "error",
        [`${pluginName}/${tailwindMultiline.name}`]: "error"
      }
    },
    "recommended-warn": {
      plugins: [pluginName],
      rules: {
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "warn",
        [`${pluginName}/${jsxAttributeExpression.name}`]: "warn",
        [`${pluginName}/${tailwindSortClasses.name}`]: "warn",
        [`${pluginName}/${tailwindMultiline.name}`]: "warn"
      }
    }
  },
  rules: {
    [tailwindNoUnnecessaryWhitespace.name]: tailwindNoUnnecessaryWhitespace.rule,
    [jsxAttributeExpression.name]: jsxAttributeExpression.rule,
    [tailwindSortClasses.name]: tailwindSortClasses.rule,
    [tailwindMultiline.name]: tailwindMultiline.rule
  }
} satisfies ESLint.Plugin;
