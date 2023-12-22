import eslintPluginUnicorn from "eslint-plugin-unicorn";

import eslintPluginTypeScript from "@typescript-eslint/eslint-plugin";
import eslintParserTypeScript from "@typescript-eslint/parser";

import sharedRules from "@schoero/configs/eslint";

/** @type { import("eslint").Linter.FlatConfig[] } */
export default [
  ...sharedRules,

  {
    ignores: ["src/shared/qr-code-generator.ts"]
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "eslint-plugin-typescript": eslintPluginTypeScript
    },
    rules: {
      "eslint-plugin-typescript/no-unnecessary-condition": "off"
    }
  },
  {
    files: ["examples/**/*.js", "examples/**/*.ts"],
    rules: {
      "no-undef": "off"
    }
  },
  {
    files: ["vite.config.ts", "vite.config.cjs.ts", "vite.config.bundle.ts"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: "./tsconfig.vite.json"
      }
    },
    plugins: {
      "eslint-plugin-typescript": eslintPluginTypeScript
    }
  },
  {
    files: ["examples/**/*.js", "examples/**/*.ts"],
    plugins: {
      "eslint-plugin-unicorn": eslintPluginUnicorn
    },
    rules: {
      "eslint-plugin-unicorn/prefer-node-protocol": "off"
    }
  }
];
