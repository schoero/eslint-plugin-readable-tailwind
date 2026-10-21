# Presets

By default, the plugin uses a broad set of [selectors](../configuration/advanced.md#selectors) that covers all supported frameworks and [utilities](../../README.md#utilities) at once. See the [defaults documentation](./defaults.md) for the full list.

If your project only uses a specific framework or a few utilities, you can compose your own `selectors` from the presets exported from `eslint-plugin-better-tailwindcss/presets`. This narrows down which strings get linted and reduces false positives.

Each preset is an array of selectors that can be spread into the `selectors` option. Presets can be freely combined with each other and with your own custom selectors.

> [!NOTE]
> Providing `selectors` **replaces** the defaults. Only the presets and selectors you list will be linted.

<br/>
<br/>

## Usage

```js
// eslint.config.js
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { clsx, cn, cva, react, variables } from "eslint-plugin-better-tailwindcss/presets";
import { defineConfig } from "eslint/config";

export default defineConfig({
  plugins: {
    "better-tailwindcss": eslintPluginBetterTailwindcss
  },
  settings: {
    "better-tailwindcss": {
      entryPoint: "app/globals.css",
      selectors: [
        ...react,
        ...cn,
        ...clsx,
        ...cva,
        ...variables
      ]
    }
  }
});
```

<br/>
<br/>

## Frameworks

Framework presets contain [attribute selectors](../configuration/advanced.md#attribute) only.

| Preset    | Lints                                                                                  |
| --------- | -------------------------------------------------------------------------------------- |
| `html`    | `class="..."`, `class={...}`                                                           |
| `react`   | `className="..."`, `className={...}`                                                   |
| `preact`  | everything in `html` and `react`                                                       |
| `qwik`    | everything in `html`                                                                   |
| `solid`   | everything in `html`, `classList={{ ... }}`                                            |
| `vue`     | everything in `html`, `:class="..."`, `v-bind:class="..."`                             |
| `svelte`  | everything in `html`, `class:name={...}`                                               |
| `astro`   | everything in `html`, `class:list={...}`                                               |
| `angular` | everything in `html`, `[class]="..."`, `[ngClass]="..."`, `[class.name]="..."`         |

Frameworks that are not listed and use the plain `class` attribute can use the `html` preset.

<br/>
<br/>

## Utilities

Utility presets contain [callee](../configuration/advanced.md#callee) and [tag](../configuration/advanced.md#tag) selectors.

| Preset    | Utility                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| `twMerge` | [tailwind merge](https://github.com/dcastil/tailwind-merge): `twMerge`                   |
| `twJoin`  | [tailwind merge](https://github.com/dcastil/tailwind-merge): `twJoin`                    |
| `cva`     | [class variance authority](https://github.com/joe-bell/cva): `cva`                       |
| `cx`      | [class variance authority](https://github.com/joe-bell/cva): `cx`                        |
| `tv`      | [tailwind variants](https://github.com/nextui-org/tailwind-variants): `tv`               |
| `cn`      | [shadcn](https://ui.shadcn.com/docs/installation/manual): `cn`                           |
| `cc`      | [classcat](https://github.com/jorgebucaran/classcat): `cc`                               |
| `clb`     | [class list builder](https://github.com/crswll/clb): `clb`                               |
| `clsx`    | [clsx](https://github.com/lukeed/clsx): `clsx`                                           |
| `cnb`     | [cnbuilder](https://github.com/xobotyi/cnbuilder): `cnb`                                 |
| `dcnb`    | [cnbuilder](https://github.com/xobotyi/cnbuilder): `dcnb`                                |
| `ctl`     | [classnames template literals](https://github.com/netlify/classnames-template-literals) |
| `objstr`  | [obj str](https://github.com/lukeed/obj-str): `objstr`                                   |
| `twc`     | [react-twc](https://github.com/gregberge/twc): `twc`                                     |
| `twx`     | [react-twc](https://github.com/gregberge/twc): `twx`                                     |

<br/>
<br/>

## Variables

The `variables` preset contains the default [variable selectors](../configuration/advanced.md#variable). It lints string values of variables named `className`, `classNames`, `classes`, `style` and `styles`.

<br/>
<br/>

## Combining with custom selectors

Presets are plain arrays of selectors, so they can be combined with your own selectors:

```js
import { cn, react } from "eslint-plugin-better-tailwindcss/presets";
import { MatcherType, SelectorKind } from "eslint-plugin-better-tailwindcss/types";

export default {
  settings: {
    "better-tailwindcss": {
      selectors: [
        ...react,
        ...cn,
        {
          kind: SelectorKind.Callee,
          match: [{ type: MatcherType.String }],
          name: "^myFunction$"
        }
      ]
    }
  }
};
```
