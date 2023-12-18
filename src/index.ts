import { tailwindMultiline } from "eptm:rules:tailwind-multiline.js";
import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindSortClasses } from "eptm:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


const pluginName = "readable-tailwind";

export default {
  configs: {
    error: {
      plugins: [pluginName],
      rules: {
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "error",
        [`${pluginName}/${tailwindSortClasses.name}`]: "error",
        [`${pluginName}/${tailwindMultiline.name}`]: "error"
      }
    },
    warning: {
      plugins: [pluginName],
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
