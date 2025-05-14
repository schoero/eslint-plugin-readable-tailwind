import { tailwindMultiline } from "better-tailwindcss:rules:tailwind-multiline.js";
import { tailwindNoConflictingClasses } from "better-tailwindcss:rules:tailwind-no-conflicting-classes.js";
import { tailwindNoDuplicateClasses } from "better-tailwindcss:rules:tailwind-no-duplicate-classes.js";
import { tailwindNoUnnecessaryWhitespace } from "better-tailwindcss:rules:tailwind-no-unnecessary-whitespace.js";
import { tailwindNoUnregisteredClasses } from "better-tailwindcss:rules:tailwind-no-unregistered-classes.js";
import { tailwindSortClasses } from "better-tailwindcss:rules:tailwind-sort-classes.js";

import type { ESLint } from "eslint";


const pluginName = "better-tailwindcss";

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
