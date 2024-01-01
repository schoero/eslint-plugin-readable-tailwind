# Vue

To lint Vue files you need to install the [vue-eslint-parser](https://github.com/vuejs/vue-eslint-parser).

```sh
npm i -D vue-eslint-parser
```

<br/>

## Usage

### Flat config

```js
// eslint.config.js
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";
import eslintParserVue from "vue-eslint-parser";

export default [
  {
    languageOptions: {
      parser: eslintParserVue
    },
    plugins: {
      "readable-tailwind": eslintPluginReadableTailwind
    },
    rules: {
      // enable all recommended rules to warn
      ...eslintPluginReadableTailwind.configs.warning,
      // enable all recommended rules to error
      ...eslintPluginReadableTailwind.configs.error,

      // or configure rules individually
      "readable-tailwind/multiline": ["warn", { printWidth: 100 }]
    }
  }
];
```

<br/>

#### VSCode

To enable the new flat config format in VSCode, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.experimental.useFlatConfig": true
}
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

### VSCode

To enable the VSCode ESLint Plugin to validate Vue files, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.validate": [/* ...other formats */, "vue"]
}
```
