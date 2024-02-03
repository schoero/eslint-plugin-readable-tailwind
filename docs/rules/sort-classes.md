# readable-tailwind/sort-classes

💼⚠️ This rule is enabled in the ![error](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-error.svg) `error` config. This rule _warns_ in the ![warning](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-warning.svg) `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Description

Enforce the order of tailwind classes. It is possible to sort classes alphabetically or logically.

Order:

- `asc`: Sort classes alphabetically in ascending order.
- `desc`: Sort classes alphabetically in descending order.
- `official`: Sort classes according to the official sorting order from tailwindcss.
- `improved`: Same as `official` but also sorts by data-attributes.

> [!NOTE]
> If you also use [eslint-plugin-tailwindcss](https://github.com/francoismassart/eslint-plugin-tailwindcss) you should disable the rule [eslint-plugin-tailwindcss/classnames-order](https://github.com/francoismassart/eslint-plugin-tailwindcss/blob/master/docs/rules/classnames-order.md), and use this rule instead. Otherwise, the two rules may conflict with each other.

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

## Options

<!-- begin auto-generated rule options list -->

| Name              | Description                                                                                                                                      | Type     | Choices                               | Default                           |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------------ | :-------------------------------- |
| `callees`         | List of function names whose arguments should also be considered.                                                                                | String[] |                                       | [`clsx`, `cva`, `ctl`, `twMerge`] |
| `classAttributes` | The name of the attribute that contains the tailwind classes.                                                                                    | String[] |                                       | [`class`, `className`]            |
| `order`           | The algorithm to use when sorting classes.                                                                                                       | String   | `asc`, `desc`, `official`, `improved` | `improved`                        |
| `tailwindConfig`  | The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration. | String   |                                       |                                   |

<!-- end auto-generated rule options list -->
