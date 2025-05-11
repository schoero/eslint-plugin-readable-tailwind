# Angular

To use ESLint with Angular, install [Angular ESLint](https://github.com/angular-eslint/angular-eslint?tab=readme-ov-file#quick-start). You can follow the [flat config](https://github.com/angular-eslint/angular-eslint/blob/main/docs/CONFIGURING_FLAT_CONFIG.md) or [legacy config](https://github.com/angular-eslint/angular-eslint/blob/main/docs/CONFIGURING_ESLINTRC.md) setup, which includes rules from the Angular ESLint package or you can add the parser directly by following the steps below.

To enable eslint-plugin-better-tailwindcss, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D angular-eslint
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintParserAngular from "angular-eslint";
import eslintPluginReadableTailwind from "eslint-plugin-better-tailwindcss";

export default [
  {

    files: ["**/*.ts"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true
      }
    },
    processor: eslintParserAngular.processInlineTemplates
  },
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: eslintParserAngular.templateParser
    }
  },
  {
    plugins: {
      "better-tailwindcss": eslintPluginReadableTailwind
    },
    rules: {
      // enable all recommended rules to warn
      ...eslintPluginReadableTailwind.configs.warning.rules,
      // enable all recommended rules to error
      ...eslintPluginReadableTailwind.configs.error.rules,

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
  "overrides": [
    {
      "files": ["**/*.ts"],
      "parser": "@typescript-eslint/parser",
      "extends": [
        "plugin:@angular-eslint/template/process-inline-templates"
      ]
    },
    {
      "files": ["**/*.html"],
      "extends": [
        // enable all recommended rules to warn
        "plugin:better-tailwindcss/warning",
        // enable all recommended rules to error
        "plugin:better-tailwindcss/error"
      ],
      "parser": "@angular-eslint/template-parser",
      "plugins": ["better-tailwindcss"],
      "rules": {
        // or configure rules individually
        "better-tailwindcss/multiline": ["warn", { "printWidth": 100 }]
      }
    }
  ]
}
```

<br/>

### Editor configuration

#### VSCode

To enable the [VSCode ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to validate HTML files, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.validate": [/* ...other formats */, "html"]
}
```
