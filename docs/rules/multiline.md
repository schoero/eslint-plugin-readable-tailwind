# readable-tailwind/multiline

💼⚠️ This rule is enabled in the ![error](./assets/checkmark-error.svg) `error` config. This rule _warns_ in the ![warning](./assets/checkmark-warning.svg) `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Description

Enforce tailwind classes to be broken up into multiple lines. It is possible to break at a certain print width or a certain number of classes per line.

## Examples

With the default options, a class name will be broken up into multiple lines and grouped by their modifiers. Groups are separated by an empty line

```tsx
// ❌ BAD
const Test = () => <div className="text-blue underline hover:text-opacity-70" />;
```

```tsx
// ✅ GOOD
const Test = () => <div class={`
  text-blue underline

  hover:text-opacity-70
`} />;
```

## Options

<!-- begin auto-generated rule options list -->

| Name              | Description                                                                                                                                   | Type     | Choices                         | Default                           |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------ | :-------------------------------- |
| `callees`         | List of function names whose arguments should also be considered.                                                                             | String[] |                                 | [`clsx`, `cva`, `ctl`, `twMerge`] |
| `classAttributes` | The name of the attribute that contains the tailwind classes.                                                                                 | String[] |                                 | [`class`, `className`]            |
| `classesPerLine`  | The maximum number of classes per line.                                                                                                       | Integer  |                                 | `100000`                          |
| `group`           | The group separator.                                                                                                                          | String   | `emptyLine`, `never`, `newLine` | `emptyLine`                       |
| `indent`          | Determines how the code should be indented.                                                                                                   | Integer  |                                 | `2`                               |
| `printWidth`      | The maximum line length. Lines are wrapped appropriately to stay within this limit or within the limit provided by the classesPerLine option. | Integer  |                                 | `80`                              |

<!-- end auto-generated rule options list -->
