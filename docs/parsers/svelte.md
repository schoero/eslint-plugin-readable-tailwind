# Svelte

- [ESLint](#eslint)
- [Oxlint](#oxlint)

<br/>

## ESLint

To use ESLint with Svelte files, first install the [svelte-eslint-parser](https://github.com/sveltejs/svelte-eslint-parser).

```sh
npm i -D svelte-eslint-parser
```

To lint Tailwind CSS classes in Svelte files, ensure that:

- The `svelte-eslint-parser` is installed and configured.
- The plugin is added to your configuration.
- The `settings` object contains the correct Tailwind CSS configuration paths.

<br/>

### Flat config

Read more about the [ESLint flat config format](https://eslint.org/docs/latest/use/configure/configuration-files-new)

<br/>

```js
// eslint.config.js

import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { defineConfig } from "eslint/config";
import eslintParserSvelte from "svelte-eslint-parser";

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

  files: ["**/*.svelte"],

  languageOptions: {
    parser: eslintParserSvelte
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

    "parser": "svelte-eslint-parser"
  }
  ```

</details>

<br/>

### Style blocks

Svelte components can declare scoped classes in a `<style>` block. Add a [`style` selector](../configuration/advanced.md#style) so the plugin knows about those sources. The class selectors declared in the block are then treated as known by [`no-unknown-classes`](../rules/no-unknown-classes.md), and the Tailwind classes used inside `@apply` are linted as well.

```js
// eslint.config.js

import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/defaults";

export default {
  rules: {
    "better-tailwindcss/no-unknown-classes": ["error", {
      selectors: [
        ...getDefaultSelectors(),
        { element: "^style$", kind: "style" }
      ]
    }]
  }
};
```

```svelte
<style>
  /* `@apply` is linted, `.local-card` becomes a known class */
  .local-card { @apply font-bold; }
</style>

<div class="local-card" />
```

<br/>

## Oxlint

Oxlint currently does **not** support Svelte files (`.svelte`).
Framework-specific parsers like Svelte are not supported in Oxlint yet, so `eslint-plugin-better-tailwindcss` cannot currently lint Svelte templates through Oxlint.

You can continue using ESLint for Svelte files until Oxlint adds framework parser support.
