import { tailwindMultiline } from "readable-tailwind:rules:tailwind-multiline.js";
import { tailwindNoConflictingClasses } from "readable-tailwind:rules:tailwind-no-conflicting-classes.js";
import { tailwindNoDuplicateClasses } from "readable-tailwind:rules:tailwind-no-duplicate-classes.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindNoUnregisteredClasses } from "readable-tailwind:rules:tailwind-no-unregistered-classes.js";
import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


const pluginName = "readable-tailwind";

export const config = {
  configs: {
    error: {
      rules: {
        [`${pluginName}/${tailwindMultiline.name}`]: "error",
        [`${pluginName}/${tailwindNoDuplicateClasses.name}`]: "error",
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "error",
        [`${pluginName}/${tailwindSortClasses.name}`]: "error"
      }
    },
    warning: {
      rules: {
        [`${pluginName}/${tailwindMultiline.name}`]: "warn",
        [`${pluginName}/${tailwindNoDuplicateClasses.name}`]: "warn",
        [`${pluginName}/${tailwindNoUnnecessaryWhitespace.name}`]: "warn",
        [`${pluginName}/${tailwindSortClasses.name}`]: "warn"
      }
    }
  },
  rules: {
    [tailwindMultiline.name]: tailwindMultiline.rule,
    [tailwindNoConflictingClasses.name]: tailwindNoConflictingClasses.rule,
    [tailwindNoDuplicateClasses.name]: tailwindNoDuplicateClasses.rule,
    [tailwindNoUnnecessaryWhitespace.name]: tailwindNoUnnecessaryWhitespace.rule,
    [tailwindNoUnregisteredClasses.name]: tailwindNoUnregisteredClasses.rule,
    [tailwindSortClasses.name]: tailwindSortClasses.rule
  }
} satisfies ESLint.Plugin;
