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
        [`${pluginName}/${jsxAttributeExpression.name}`]: "error",
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "error",
        [`${pluginName}/${tailwindSortClasses.name}`]: "error",
        [`${pluginName}/${tailwindMultiline.name}`]: "error"
      }
    },
    "recommended-warn": {
      plugins: [pluginName],
      rules: {
        [`${pluginName}/${jsxAttributeExpression.name}`]: "warn",
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "warn",
        [`${pluginName}/${tailwindSortClasses.name}`]: "warn",
        [`${pluginName}/${tailwindMultiline.name}`]: "warn"
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
