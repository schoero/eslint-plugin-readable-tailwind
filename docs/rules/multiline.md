# better-tailwindcss/multiline

Enforce tailwind classes to be broken up into multiple lines. It is possible to break at a certain print width or a certain number of classes per line.

<br/>

## Options

### `printWidth`

  The maximum line length. Lines are wrapped appropriately to stay within this limit. The value `0` disables line wrapping by `printWidth`.

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

### `lineBreakStyle`

  The line break style.  
  The style `windows` will use `\r\n` as line breaks and `unix` will use `\n`.

  **Type**: `"windows" | "unix"`  
  **Default**: `"unix"`

<br/>

### `attributes`

  The name of the attribute that contains the tailwind classes. This can also be set globally via the [`settings` object](../settings/settings.md#attributes).  

  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**: [Name](../configuration/advanced.md#name-based-matching) for `"class"` and [strings Matcher](../configuration/advanced.md#types-of-matchers) for `"class", "className"`

<br/>

### `callees`

  List of function names which arguments should get linted. This can also be set globally via the [`settings` object](../settings/settings.md#callees).  
  
  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**: [Matchers](../configuration/advanced.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

### `variables`

  List of variable names whose initializer should get linted. This can also be set globally via the [`settings` object](../settings/settings.md#variables).  
  
  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**:  [strings Matcher](../configuration/advanced.md#types-of-matchers) for `"className", "classNames", "classes", "style", "styles"`

<br/>

### `tags`

  List of template literal tag names whose content should get linted. This can also be set globally via the [`settings` object](../settings/settings.md#tags).  
  
  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**: None

  Note: When using the `tags` option, it is recommended to use the [strings Matcher](../configuration/advanced.md#types-of-matchers) for your tag names. This will ensure that nested expressions get linted correctly.

<br/>

### `entryPoint`

  The path to the entry file of the css based tailwind config (eg: `src/global.css`). This can also be set globally via the [`settings` object](../settings/settings.md#entrypoint).  
  If not specified, the plugin will fall back to the default configuration.  

  **Type**: `string`  
  **Default**: `undefined`

<br/>

### `tailwindConfig`

  The path to the `tailwind.config.js` file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.  
  This can also be set globally via the [`settings` object](../settings/settings.md#tailwindConfig).  

  For tailwindcss v4 and the css based config, use the [`entryPoint`](#entrypoint) option instead.

  **Type**: `string`  
  **Default**: `undefined`

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
