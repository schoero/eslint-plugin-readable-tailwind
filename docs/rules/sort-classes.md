# readable-tailwind/sort-classes

💼⚠️ This rule is enabled in the ![error](https://github.com/schoero/eslint-plugin-readable-tailwind/assets/checkmark-error.svg) `error` config. This rule _warns_ in the ![warning](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-warning.svg) `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Description

Enforce the order of tailwind classes. It is possible to sort classes alphabetically or logically.

Order:

- `asc`: Sort classes alphabetically in ascending order.
- `desc`: Sort classes alphabetically in descending order.
- `official`: Sort classes according to the official sorting order from tailwindcss.
- `improved`: Same as `official` but also sorts by data-attributes.

## Examples

```tsx
// ❌ BAD
const Test = () => <div className="text-blue underline hover:text-opacity-70"/>;
```

```tsx
// ✅ GOOD
const Test = () => <div className="text-blue underline hover:text-opacity-70"/>;
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
