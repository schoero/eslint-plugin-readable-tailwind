# readable-tailwind/sort-classes

Enforce the order of tailwind classes. It is possible to sort classes alphabetically or logically.

<br/>

> [!WARNING]
> If you also use [eslint-plugin-tailwindcss](https://github.com/francoismassart/eslint-plugin-tailwindcss) you should disable the rule [eslint-plugin-tailwindcss/classnames-order](https://github.com/francoismassart/eslint-plugin-tailwindcss/blob/master/docs/rules/classnames-order.md), and use this rule instead. Otherwise, the two rules may conflict with each other.

## Options

- `order`

  - `asc`: Sort classes alphabetically in ascending order.
  - `desc`: Sort classes alphabetically in descending order.
  - `official`: Sort classes according to the official sorting order from tailwindcss.
  - `improved`: Same as `official` but also sorts by data-attributes.

  **Type**: `"asc" | "desc" | "official" | "improved"`  
  **Default**: `"improved"`

<br/>

- `tailwindConfig`

  The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.  
  The tailwind config is used to determine the sorting order.

  **Type**: `string`  
  **Default**: `undefined`

<br/>

- `classAttributes`

  The name of the attribute that contains the tailwind classes.

  **Type**: Array of [Name](../concepts/name.md), [Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**: [strings Matcher](../concepts/matchers.md#types-of-matchers) for `"class", "className"`

<br/>

- `callees`

  List of function names which arguments should also get linted.
  
  **Type**: Array of [Name](../concepts/name.md), [Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**: [Matchers](../concepts/matchers.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

- `variables`

  List of variable names which initializer should also get linted.
  
  **Type**: Array of [Name](../concepts/name.md), [Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**:  [strings Matcher](../concepts/matchers.md#types-of-matchers) for `"className", "classNames", "classes", "style", "styles"`

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

```tsx
// ✅ GOOD: with option { order: 'improved' }
<div class="text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70"/>;
```
