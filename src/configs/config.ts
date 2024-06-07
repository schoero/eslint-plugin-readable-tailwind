import { tailwindMultiline } from "readable-tailwind:rules:tailwind-multiline.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


const pluginName = "readable-tailwind";

export const config = {
  configs: {
    error: {
      rules: {
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "error",
        [`${pluginName}/${tailwindSortClasses.name}`]: "error",
        [`${pluginName}/${tailwindMultiline.name}`]: "error"
      }
    },
    warning: {
      rules: {
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "warn",
        [`${pluginName}/${tailwindSortClasses.name}`]: "warn",
        [`${pluginName}/${tailwindMultiline.name}`]: "warn"
      }
    }
  },
  rules: {
    [tailwindNoUnnecessaryWhitespace.name]: tailwindNoUnnecessaryWhitespace.rule,
    [tailwindSortClasses.name]: tailwindSortClasses.rule,
    [tailwindMultiline.name]: tailwindMultiline.rule
  }
} satisfies ESLint.Plugin;
