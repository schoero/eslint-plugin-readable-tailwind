# Svelte

To use ESLint with Svelte files, first install the [svelte-eslint-parser](https://github.com/sveltejs/svelte-eslint-parser). Then, configure ESLint to use this parser for Svelte files.

To enable eslint-plugin-better-tailwindcss, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D svelte-eslint-parser
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintPluginReadableTailwind from "eslint-plugin-better-tailwindcss";
import eslintParserSvelte from "svelte-eslint-parser";

export default [
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: eslintParserSvelte
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
  "extends": [
    // enable all recommended rules to warn
    "plugin:better-tailwindcss/warning",
    // enable all recommended rules to error
    "plugin:better-tailwindcss/error"
  ],
  "parser": "svelte-eslint-parser",
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

To enable the [VSCode ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to validate Svelte files, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.validate": [/* ...other formats */, "svelte"]
}
```
