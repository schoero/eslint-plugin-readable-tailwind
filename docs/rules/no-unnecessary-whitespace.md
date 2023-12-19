# readable-tailwind/no-unnecessary-whitespace

💼⚠️ This rule is enabled in the ✅ `error` config. This rule _warns_ in the ✅ `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Description

Disallow unnecessary whitespace in between and around tailwind classes.

## Examples

```tsx
// ❌ BAD
const Test = () => <div className=" text-blue  underline hover:text-opacity-70 " />;
```

```tsx
// ✅ GOOD
const Test = () => <div className="text-blue underline hover:text-opacity-70"/>;
```

## Options

<!-- begin auto-generated rule options list -->

| Name              | Description                                                                                                                                              | Type     | Default                           |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :-------------------------------- |
| `allowMultiline`  | Allow multi-line class declarations. If this option is disabled, template literal strings will be collapsed into a single line string wherever possible. | Boolean  | `true`                            |
| `callees`         | List of function names whose arguments should also be considered.                                                                                        | String[] | [`clsx`, `cva`, `ctl`, `twMerge`] |
| `classAttributes` | The name of the attribute that contains the tailwind classes.                                                                                            | String[] | [`class`, `className`]            |

<!-- end auto-generated rule options list -->
