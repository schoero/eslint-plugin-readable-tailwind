# readable-tailwind/sort-classes

Enforce the order of tailwind classes. It is possible to sort classes alphabetically or logically.

<br/>

> [!INFO]
> In order to sort classes logically, the plugin needs to know the order of the tailwind classes.
> This is done by providing the [`configPath`](#tailwindconfig) to the tailwind config file or the [`entryPoint`](#entrypoint) of the tailwind css based config.

## Options

### `order`

- `asc`: Sort classes alphabetically in ascending order.
- `desc`: Sort classes alphabetically in descending order.
- `official`: Sort classes according to the official sorting order from tailwindcss.
- `improved`: Same as `official` but sorts variants more strictly.

  **Type**: `"asc" | "desc" | "official" | "improved"`  
  **Default**: `"improved"`

<br/>

### `entryPoint`

  The path to the entry file of the tailwind css based config (eg: `src/global.css`). This can also be set globally via the [`settings` object](../settings/settings.md#entrypoint).  
  If not specified, the plugin will fall back to the default configuration.  
  The tailwind config is used to determine the sorting order.

  **Type**: `string`  
  **Default**: `undefined`

<br/>

### `tailwindConfig`

  The path to the `tailwind.config.js` file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.  
  This can also be set globally via the [`settings` object](../settings/settings.md#tailwindConfig).  
  
  The tailwind config is used to determine the sorting order.

  For tailwindcss v4 and the css based config, use the [`entryPoint`](#entrypoint) option instead.

  **Type**: `string`  
  **Default**: `undefined`

<br/>

### `attributes`

  The name of the attribute that contains the tailwind classes. This can also be set globally via the [`settings` object](../settings/settings.md#attributes).  

  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**: [Name](../concepts/concepts.md#name) for `"class"` and [strings Matcher](../concepts/concepts.md#types-of-matchers) for `"class", "className"`

<br/>

### `callees`

  List of function names which arguments should also get linted. This can also be set globally via the [`settings` object](../settings/settings.md#callees).  
  
  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**: [Matchers](../concepts/concepts.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

### `variables`

  List of variable names whose initializer should also get linted. This can also be set globally via the [`settings` object](../settings/settings.md#variables).  
  
  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**:  [strings Matcher](../concepts/concepts.md#types-of-matchers) for `"className", "classNames", "classes", "style", "styles"`

<br/>

### `tags`

  List of template literal tag names whose content should get linted. This can also be set globally via the [`settings` object](../settings/settings.md#tags).  
  
  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**: None

  Note: When using the `tags` option, it is recommended to use the [strings Matcher](../concepts/concepts.md#types-of-matchers) for your tag names. This will ensure that nested expressions get linted correctly.

<br/>

## Examples

```tsx
// ❌ BAD: all classes are in random order
<div class="underline hover:text-opacity-70 focus:font-bold text-black hover:font-bold focus:text-opacity-70"/>;
```

```tsx
// ✅ GOOD: with option { order: 'asc' }
<div class="focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70 text-black underline"/>;
```

```tsx
// ✅ GOOD: with option { order: 'desc' }
<div class="underline text-black hover:text-opacity-70 hover:font-bold focus:text-opacity-70 focus:font-bold"/>;
```

```tsx
// ✅ GOOD: with option { order: 'official' }
<div class="text-black underline hover:font-bold hover:text-opacity-70 focus:font-bold focus:text-opacity-70"/>;
```
