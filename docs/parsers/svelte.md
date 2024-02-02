# Svelte

To lint Svelte files you need to install the [svelte-eslint-parser](https://github.com/sveltejs/svelte-eslint-parser).

```sh
npm i -D svelte-eslint-parser
```

<br/>

## Usage

### Flat config

```js
// eslint.config.js
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";
import eslintParserSvelte from "svelte-eslint-parser";

export default [
  {
    languageOptions: {
      parser: eslintParserSvelte
    },
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
  "parser": "svelte-eslint-parser",
  "plugins": ["readable-tailwind"],
  "rules": {
    // or configure rules individually
    "readable-tailwind/multiline": ["warn", { "printWidth": 100 }]
  }
}
```

### VSCode

To enable the VSCode ESLint Plugin to validate Svelte files, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.validate": [/* ...other formats */, "svelte"]
}
```
