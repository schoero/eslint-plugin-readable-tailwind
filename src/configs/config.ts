/* eslint-disable eslint-plugin-typescript/naming-convention */
import { multiline } from "better-tailwindcss:rules:multiline.js";
import { noConflictingClasses } from "better-tailwindcss:rules:no-conflicting-classes.js";
import { noDuplicateClasses } from "better-tailwindcss:rules:no-duplicate-classes.js";
import { noRestrictedClasses } from "better-tailwindcss:rules:no-restricted-classes.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules:no-unnecessary-whitespace.js";
import { noUnregisteredClasses } from "better-tailwindcss:rules:no-unregistered-classes.js";
import { sortClasses } from "better-tailwindcss:rules:sort-classes.js";

import type { ESLint } from "eslint";


const plugin = {
  meta: {
    name: "better-tailwindcss"
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

const plugins = [plugin.meta.name];


const getStylisticRules = (severity: "error" | "warn") => {
  return {
    [`${plugin.meta.name}/${multiline.name}`]: severity,
    [`${plugin.meta.name}/${noDuplicateClasses.name}`]: severity,
    [`${plugin.meta.name}/${noUnnecessaryWhitespace.name}`]: severity,
    [`${plugin.meta.name}/${sortClasses.name}`]: severity
  };
};

const getCorrectnessRules = (severity: "error" | "warn") => {
  return {
    [`${plugin.meta.name}/${noConflictingClasses.name}`]: severity,
    [`${plugin.meta.name}/${noUnregisteredClasses.name}`]: severity
  };
};


export const config = {
  ...plugin,

  configs: {
    "stylistic": {
      plugins,
      rules: {
        ...getStylisticRules("warn")
      }
    },
    "stylistic-error": {
      plugins,
      rules: getStylisticRules("error")
    },
    "stylistic-warn": {
      plugins,
      rules: getStylisticRules("warn")
    },

    "correctness": {
      plugins,
      rules: {
        ...getCorrectnessRules("error")
      }
    },
    "correctness-error": {
      plugins,
      rules: getCorrectnessRules("error")
    },
    "correctness-warn": {
      plugins,
      rules: getCorrectnessRules("warn")
    },

    "all": {
      plugins,
      rules: {
        ...getStylisticRules("warn"),
        ...getCorrectnessRules("error")
      }
    },
    "all-error": {
      plugins,
      rules: {
        ...getStylisticRules("error"),
        ...getCorrectnessRules("error")
      }
    },
    "all-warn": {
      plugins,
      rules: {
        ...getStylisticRules("warn"),
        ...getCorrectnessRules("warn")
      }
    }
  }
} satisfies ESLint.Plugin;
