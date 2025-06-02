# Astro

To use ESLint with Astro files, first install the [astro-eslint-parser](https://github.com/ota-meshi/astro-eslint-parser). Then, configure ESLint to use this parser for Astro files.

To use TypeScript within Astro files, you can also install the [@typescript-eslint/parser](https://typescript-eslint.io/packages/parser) and configure it via the `parser` option in the `languageOptions` section of your ESLint configuration.

To enable eslint-plugin-better-tailwindcss, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintParserAstro from "astro-eslint-parser";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

export default [
  {
    files: ["*.astro"],
    languageOptions: {
      parser: eslintParserAstro,
      parserOptions: {
        // optionally use TypeScript parser within for Astro files
        parser: eslintParserTypeScript
      }
    },
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      // enable all recommended rules to report a warning
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      // enable all recommended rules to report an error
      ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,

      // or configure rules individually
      "better-tailwindcss/multiline": ["warn", { printWidth: 100 }]
    }
  }
];
```

<br/>

```jsonc
// .eslintrc.json
{
  "extends": [
    // enable all recommended rules to report a warning
    "plugin:better-tailwindcss/recommended-warn",
    // enable all recommended rules to report an error
    "plugin:better-tailwindcss/recommended-error"
  ],
  "parser": "astro-eslint-parser",
  "parserOptions": {
    // optionally use TypeScript parser within for Astro files
    "parser": "@typescript-eslint/parser"
  },
  "plugins": ["better-tailwindcss"],
  "rules": {
    // or configure rules individually
    "better-tailwindcss/multiline": ["warn", { "printWidth": 100 }]
  }
}
```

<br/>

### Editor configuration

#### VSCode

To enable the [VSCode ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to validate Astro files, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.validate": [/* ...other formats */, "astro"]
}
```
