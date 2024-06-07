# Vue

To use ESLint with Vue files, first install the [vue-eslint-parser](https://github.com/vuejs/vue-eslint-parser). Then, configure ESLint to use this parser for Vue files.

To enable eslint-plugin-readable-tailwind, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D vue-eslint-parser
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";
import eslintParserVue from "vue-eslint-parser";

export default [
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: eslintParserVue
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
  "parser": "vue-eslint-parser",
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

To enable the [VSCode ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to validate Vue files, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.validate": [/* ...other formats */, "vue"]
}
```
