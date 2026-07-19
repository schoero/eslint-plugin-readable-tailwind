# better-tailwindcss/enforce-consistent-line-wrapping

Enforce tailwind classes to be broken up into multiple lines. It is possible to break at a certain print width or a certain number of classes per line.

<br/>

## Options

### `printWidth`

  The maximum line length. Lines are wrapped appropriately to stay within this limit. The value `0` disables line wrapping by `printWidth`.
  Tabs count according to [`tabWidth`](#tabwidth) when evaluating this limit.

  **Type**: `number`  
  **Default**: `80`

<br/>

### `classesPerLine`

  The maximum amount of classes per line. Lines are wrapped appropriately to stay within this limit . The value `0` disables line wrapping by `classesPerLine`.

  **Type**: `number`  
  **Default**: `0`

<br/>

### `group`

  Defines how different groups of classes should be separated. A group is a set of classes that share the same variant.

  **Type**: `"emptyLine" | "never" | "newLine"`  
  **Default**: `"newLine"`  

<br/>

### `preferSingleLine`

  Prefer a single line for different variants. When set to `true`, the rule will keep all variants on a single line until the line exceeds the `printWidth` or `classesPerLine` limit.

  **Type**: `boolean`  
  **Default**: `false`  

<br/>

### `indent`

  Determines how the code should be indented. A number defines the amount of space characters, and the string `"tab"` will use a single tab character.

  **Type**: `number | "tab"`  
  **Default**: `2`

<br/>

### `tabWidth`

  Determines how many columns a tab character contributes when checking `printWidth`.
  This option only affects width calculations and does not change emitted indentation characters.

  **Type**: `number`  
  **Default**: `1`

<br/>

### `lineBreakStyle`

  The line break style.  
  The style `windows` will use `\r\n` as line breaks and `unix` will use `\n`.

  **Type**: `"windows" | "unix"`  
  **Default**: `"unix"`

<br />

### `strictness`

  When used in combination with formatters like prettier, biome or oxfmt, the line wrapping might interfere with the line wrapping of those formatters in some [edge cases](https://github.com/schoero/eslint-plugin-better-tailwindcss/issues/243).  
  If you experience such issues, you can set the `strictness` option to `"loose"` to make the rule less strict about line wrapping.
  This will allow the lines to slightly exceed the `printWidth` if the plugin detects that the line wrapping would likely cause conflicts with a formatter.

  **Type**: `"strict" | "loose"`  
  **Default**: `"strict"`

<br/>

### `vueConvertToBinding`

  When used together with prettier, a static `class` attribute that this rule wraps across multiple lines gets collapsed back onto a single line by prettier, which leads to an [endless conflict](https://github.com/schoero/eslint-plugin-better-tailwindcss/issues/290).  
  Setting this option to `true` converts the static attribute to a bound attribute with a template literal (`class="…"` → `` :class="`…`" ``) before wrapping, which prettier leaves untouched.

  This option is currently only supported by the vue parser. Existing bindings and classes that already fit on a single line are not changed. If the element already has a binding with the same name (`class="…" :class="…"`), the static attribute is kept and wrapped in place to not create a duplicate attribute.

  **Type**: `boolean`  
  **Default**: `false`

<br/>

<details>
  <summary>Common options</summary>

  <br/>

  These options are common to all rules and can also be set globally via the [`settings` object](../settings/settings.md).

  <br/>

### `selectors`

  Flat list of selectors that determines where Tailwind class strings are linted.

  **Type**: Array of [Selectors](../configuration/advanced.md#selectors)
  **Default**: See [defaults API](../api/defaults.md)

  <br/>

### `entryPoint`

  The path to the entry file of the css based tailwind config (eg: `src/global.css`).  
  If not specified, the plugin will fall back to the default configuration.  

  **Type**: `string`  
  **Default**: `undefined`

  <br/>

### `tailwindConfig`

  The path to the `tailwind.config.js` file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.  
  This can also be set globally via the [`settings` object](../settings/settings.md#tailwindConfig).  

  For Tailwind CSS v4 and the css based config, use the [`entryPoint`](#entrypoint) option instead.

  **Type**: `string`  
  **Default**: `undefined`

<br/>

### `tsconfig`

  The path to the `tsconfig.json` file. If not specified, the plugin will try to find it automatically.  
  This can also be set globally via the [`settings` object](../settings/settings.md#tsconfig).  

  The tsconfig is used to resolve tsconfig [`path`](https://www.typescriptlang.org/tsconfig/#paths) aliases.

  **Type**: `string`  
  **Default**: `undefined`

</details>

<br/>

## Examples

With the default options, a class name will be broken up into multiple lines and grouped by their variants. Groups are separated by an empty line.  

The following examples show how the rule behaves with different options:

```tsx
// ❌ BAD
<div class="text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70" />;
```

```tsx
// ✅ GOOD: with option { group: 'emptyLine' }
<div class={`
  text-black underline

  focus:font-bold focus:text-opacity-70

  hover:font-bold hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with option { group: 'newLine' }
<div class={`
  text-black underline
  focus:font-bold focus:text-opacity-70
  hover:font-bold hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with option { group: 'never', printWidth: 80 }
<div class={`
  text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold
  hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with { classesPerLine: 1, group: 'emptyLine' }
<div class={`
  text-black
  underline

  focus:font-bold
  focus:text-opacity-70

  hover:font-bold
  hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with { group: "newLine", preferSingleLine: true, printWidth: 120 }
<div class="text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70" />;
```

```tsx
// ✅ GOOD: with { group: "newLine", preferSingleLine: true, printWidth: 80 }
<div class={`
  text-black underline
  focus:font-bold focus:text-opacity-70
  hover:font-bold hover:text-opacity-70
`} />;
```

With `vueConvertToBinding: true`, the vue parser converts a static `class` attribute to a bound attribute with a template literal when it wraps, to avoid conflicts with prettier:

```vue
<!-- ❌ BAD -->
<template>
  <img class="absolute top-0 mr-0 mb-0 h-64 -rotate-5 bg-foreground-secondary pt-0 pr-0 opacity-30 blur-sm not-dark:invert" />
</template>
```

```vue
<!-- ✅ GOOD: with { vueConvertToBinding: true } -->
<template>
  <img :class="`
    absolute top-0 mr-0 mb-0 h-64 -rotate-5 bg-foreground-secondary pt-0 pr-0
    opacity-30 blur-sm not-dark:invert
  `" />
</template>
```
