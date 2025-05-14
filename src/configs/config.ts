import { multiline } from "better-tailwindcss:rules:multiline.js";
import { noConflictingClasses } from "better-tailwindcss:rules:no-conflicting-classes.js";
import { noDuplicateClasses } from "better-tailwindcss:rules:no-duplicate-classes.js";
import { noRestrictedClasses } from "better-tailwindcss:rules:no-restricted-classes.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules:no-unnecessary-whitespace.js";
import { noUnregisteredClasses } from "better-tailwindcss:rules:no-unregistered-classes.js";
import { sortClasses } from "better-tailwindcss:rules:sort-classes.js";

import type { ESLint } from "eslint";


const pluginName = "better-tailwindcss";

export const config = {
  configs: {
    error: {
      rules: {
        [`${pluginName}/${multiline.name}`]: "error",
        [`${pluginName}/${noDuplicateClasses.name}`]: "error",
        [`${pluginName}/${noUnnecessaryWhitespace.name}`]: "error",
        [`${pluginName}/${noUnregisteredClasses.name}`]: "error",
        [`${pluginName}/${sortClasses.name}`]: "error"
      }
    },
    warning: {
      rules: {
        [`${pluginName}/${multiline.name}`]: "warn",
        [`${pluginName}/${noDuplicateClasses.name}`]: "warn",
        [`${pluginName}/${noUnnecessaryWhitespace.name}`]: "warn",
        [`${pluginName}/${noUnregisteredClasses.name}`]: "warn",
        [`${pluginName}/${sortClasses.name}`]: "warn"
      }
    }
  },
  rules: {
    [multiline.name]: multiline.rule,
    [noConflictingClasses.name]: noConflictingClasses.rule,
    [noDuplicateClasses.name]: noDuplicateClasses.rule,
    [noRestrictedClasses.name]: noRestrictedClasses.rule,
    [noUnnecessaryWhitespace.name]: noUnnecessaryWhitespace.rule,
    [noUnregisteredClasses.name]: noUnregisteredClasses.rule,
    [sortClasses.name]: sortClasses.rule
  }
} satisfies ESLint.Plugin;
