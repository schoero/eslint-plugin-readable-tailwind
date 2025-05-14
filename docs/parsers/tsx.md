# TSX

To use ESLint with TSX files, first install the [@typescript-eslint/parser](https://typescript-eslint.io/packages/parser). Then, configure ESLint to use this parser for TypeScript files.

In addition, you need to enable `ecmaFeatures.jsx` in the parser options.

To enable eslint-plugin-better-tailwindcss, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D @typescript-eslint/parser
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

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
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      // enable all recommended rules to warn
      ...eslintPluginBetterTailwindcss.configs.warning.rules,
      // enable all recommended rules to error
      ...eslintPluginBetterTailwindcss.configs.error.rules,

      // or configure rules individually
      "better-tailwindcss/multiline": ["warn", { printWidth: 100 }]
    }
  }
];
```

<br/>

### Legacy config

```jsonc
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    // enable all recommended rules to warn
    "plugin:better-tailwindcss/warning",
    // enable all recommended rules to error
    "plugin:better-tailwindcss/error"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": "latest"
  },
  "plugins": ["better-tailwindcss"],
  "rules": {
    // or configure rules individually
    "better-tailwindcss/multiline": ["warn", { "printWidth": 100 }]
  }
}
```
