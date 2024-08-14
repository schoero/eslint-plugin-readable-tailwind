# TypeScript

To use ESLint with TypeScript files, first install the [@typescript-eslint/parser](https://typescript-eslint.io/packages/parser). Then, configure ESLint to use this parser for TypeScript files.

To enable eslint-plugin-readable-tailwind, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D @typescript-eslint/parser
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";

import eslintParserTypeScript from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true
      }
    }
  },
  {
    plugins: {
      "readable-tailwind": eslintPluginReadableTailwind
    },
    rules: {
      // enable all recommended rules to warn
      ...eslintPluginReadableTailwind.configs.warning.rules,
      // enable all recommended rules to error
      ...eslintPluginReadableTailwind.configs.error.rules,

      // or configure rules individually
      "readable-tailwind/multiline": ["warn", { printWidth: 100 }]
    }
  }
];
```

<br/>

### Legacy config

```jsonc
// .eslintrc.json
{
  "extends": [
    // enable all recommended rules to warn
    "plugin:readable-tailwind/warning",
    // or enable all recommended rules to error
    "plugin:readable-tailwind/error"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["readable-tailwind"],
  "rules": {
    // or configure rules individually
    "readable-tailwind/multiline": ["warn", { "printWidth": 100 }]
  }
}
```
