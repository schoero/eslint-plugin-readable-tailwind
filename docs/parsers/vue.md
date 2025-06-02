# Vue

To use ESLint with Vue files, first install the [vue-eslint-parser](https://github.com/vuejs/vue-eslint-parser). Then, configure ESLint to use this parser for Vue files.

To enable eslint-plugin-better-tailwindcss, you need to add it to the plugins section of your eslint configuration and enable the rules you want to use.

```sh
npm i -D vue-eslint-parser
```

<br/>

## Usage

### Flat config

Read more about the new [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

```js
// eslint.config.js
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
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

### Legacy config

```jsonc
// .eslintrc.json
{
  "extends": [
    // enable all recommended rules to report a warning
    "plugin:better-tailwindcss/recommended-warn",
    // enable all recommended rules to report an error
    "plugin:better-tailwindcss/recommended-error"
  ],
  "parser": "vue-eslint-parser",
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

To enable the [VSCode ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to validate Vue files, add the following to your `.vscode/settings.json`:

```jsonc
{
  // enable ESLint to validate Vue files
  "eslint.validate": [/* ...other formats */, "vue"],

  // enable ESLint to fix tailwind classes on save
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```
