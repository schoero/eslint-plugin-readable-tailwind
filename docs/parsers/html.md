# HTML

To use ESLint with HTML files, first install the [@html-eslint/parser](https://github.com/yeonjuan/html-eslint/tree/main/packages/parser). Then, configure ESLint to use this parser for HTML files.

To enable eslint-plugin-readable-tailwind, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D @html-eslint/parser
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintParserHTML from "@html-eslint/parser";
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";

export default [
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: eslintParserHTML
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
    // enable all recommended rules to error
    "plugin:readable-tailwind/error"
  ],
  "parser": "@html-eslint/parser",
  "plugins": ["readable-tailwind"],
  "rules": {
    // or configure rules individually
    "readable-tailwind/multiline": ["warn", { "printWidth": 100 }]
  }
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
