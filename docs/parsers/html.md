# HTML

- [ESLint](#eslint)
- [Oxlint](#oxlint)

<br/>

## ESLint

To use ESLint with HTML files, first install the [@html-eslint/parser](https://github.com/yeonjuan/html-eslint/tree/main/packages/parser).

```sh
npm i -D @html-eslint/parser
```

To lint Tailwind CSS classes in HTML files, ensure that:

- The `@html-eslint/parser` is installed and configured.
- The plugin is added to your configuration.
- The `settings` object contains the correct Tailwind CSS configuration paths.

<br/>

### Flat config

Read more about the [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

<br/>

```js
// eslint.config.js

import eslintParserHTML from "@html-eslint/parser";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { defineConfig } from "eslint/config";

export default defineConfig({
  // enable all recommended rules
  extends: [
    eslintPluginBetterTailwindcss.configs.recommended
  ],

  // if needed, override rules to configure them individually
  // rules: {
  //   "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", { printWidth: 100 }]
  // },

  settings: {
    "better-tailwindcss": {
      // tailwindcss 4: the path to the entry file of the css based tailwind config (eg: `src/global.css`)
      entryPoint: "src/global.css",
      // tailwindcss 3: the path to the tailwind config file (eg: `tailwind.config.js`)
      tailwindConfig: "tailwind.config.js"
    }
  },

  files: ["**/*.html"],

  languageOptions: {
    parser: eslintParserHTML
  }
});
```

<br/>

<details>
  <summary><h3>Legacy config</h3></summary>

  <br/>

  ```jsonc
  // .eslintrc.json

  {
    // enable all recommended rules
    "extends": [
      "plugin:better-tailwindcss/legacy-recommended"
    ],

    // if needed, override rules to configure them individually
    // "rules": {
    //   "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", { "printWidth": 100 }]
    // },

    "settings": {
      "better-tailwindcss": {
        // tailwindcss 4: the path to the entry file of the css based tailwind config (eg: `src/global.css`)
        "entryPoint": "src/global.css",
        // tailwindcss 3: the path to the tailwind config file (eg: `tailwind.config.js`)
        "tailwindConfig": "tailwind.config.js"
      }
    },

    "parser": "@html-eslint/parser"

  }
  ```

</details>

<br/>

### Template engine syntax

If your HTML files contain template engine syntax like Twig, Handlebars, ERB or Nunjucks, configure the `templateEngineSyntax` option of `@html-eslint/parser`. Template expressions will then be skipped during linting, while the static parts around them are still linted.

For example with the configuration below, `{{ isActive ? 'flex' : 'hidden' }}` is left untouched:

```html
<p class="p-4 {{ isActive ? 'flex' : 'hidden' }}">Hello</p>
```

```js
// eslint.config.js

export default defineConfig({
  // ...
  files: ["**/*.html"],

  languageOptions: {
    parser: eslintParserHTML,
    parserOptions: {
      templateEngineSyntax: [
        { close: "}}", open: "{{" }, // Twig, Handlebars, Nunjucks
        { close: "%}", open: "{%" }, // Twig, Nunjucks
        { close: "%>", open: "<%" } // ERB
      ]
    }
  }
});
```

Read more about the [templateEngineSyntax option](https://html-eslint.org/docs/integrating-template-engine) in the `@html-eslint/parser` documentation.

<br/>

## Oxlint

Oxlint currently does **not** support HTML parser integration for this use case.
Because Oxlint currently only supports JavaScript-like files, `eslint-plugin-better-tailwindcss` cannot currently lint standalone HTML files through Oxlint.

You can continue using ESLint for HTML files until broader parser support is available in Oxlint.
