# JSX

- [ESLint](#eslint)
- [Oxlint](#oxlint)

<br/>

## ESLint

To lint Tailwind CSS classes in JSX files, ensure that:

- `jsx` parsing is enabled in language options.
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

  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      }
    }
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

    "parserOptions": {
      "ecmaFeatures": {
        "jsx": true
      },
      "ecmaVersion": "latest"
    }

  }
  ```

</details>

<br/>

### Qwik scoped styles

Qwik components can declare scoped classes with [`useStylesScoped$`](https://qwik.dev/docs/components/styles/#usestylesscoped). Add a [`style` selector](../configuration/advanced.md#style) so the plugin knows about those sources. The class selectors declared in the stylesheet are then treated as known by [`no-unknown-classes`](../rules/no-unknown-classes.md), and the Tailwind classes used inside `@apply` are linted as well.

```js
// eslint.config.js

import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/defaults";

export default {
  rules: {
    "better-tailwindcss/no-unknown-classes": ["error", {
      selectors: [
        ...getDefaultSelectors(),
        { kind: "style", match: [{ type: "strings" }], path: "^useStylesScoped\\$$" }
      ]
    }]
  }
};
```

```tsx
import { component$, useStylesScoped$ } from "@builder.io/qwik";

export default component$(() => {
  // `@apply` is linted, `.local-card` becomes a known class
  useStylesScoped$(".local-card { @apply font-bold; }");
  return <div class="local-card" />;
});
```

<br/>

## Oxlint

More info about the Oxlint configuration format can be found in the [Oxlint documentation](https://oxc.rs/docs/guide/usage/linter/config.html).

To lint Tailwind CSS classes in JSX files, ensure that:

- The plugin is added to the `jsPlugins` array.
- The `settings` object contains the correct Tailwind CSS configuration paths.
- All relevant rules are added to the `rules` object.

<br/>

```js
// oxlint.config.js

import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { defineConfig } from "oxlint";

export default defineConfig({
  overrides: [{
    files: ["**/*.{js,jsx,mjs,cjs}"],
    jsPlugins: [
      "eslint-plugin-better-tailwindcss"
    ],
    rules: {
      // enable all recommended rules
      ...eslintPluginBetterTailwindcss.configs.recommended.rules,

      // if needed, override rules to configure them individually
      "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", { printWidth: 100 }]
    }
  }],
  settings: {
    "better-tailwindcss": {
      entryPoint: "src/global.css"
    }
  }
});
```
