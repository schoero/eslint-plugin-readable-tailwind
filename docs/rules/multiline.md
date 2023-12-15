# Enforce consistent line wrapping for tailwind classes (`readable-tailwind/multiline`)

💼⚠️ This rule is enabled in the `recommended-error` config. This rule _warns_ in the `recommended-warn` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Options

<!-- begin auto-generated rule options list -->

| Name              | Description                                                                                                                                   | Type     | Choices                         | Default                           |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------ | :-------------------------------- |
| `callees`         | List of function names whose arguments should also be considered.                                                                             | String[] |                                 | [`clsx`, `cva`, `ctl`, `twMerge`] |
| `classAttributes` |                                                                                                                                               | String[] |                                 |                                   |
| `classesPerLine`  | The maximum number of classes per line.                                                                                                       | Integer  |                                 | `100000`                          |
| `group`           | The group separator.                                                                                                                          | String   | `emptyLine`, `never`, `newLine` | `emptyLine`                       |
| `indent`          | Determines how the code should be indented.                                                                                                   | Integer  |                                 | `4`                               |
| `printWidth`      | The maximum line length. Lines are wrapped appropriately to stay within this limit or within the limit provided by the classesPerLine option. |          |                                 | `80`                              |

<!-- end auto-generated rule options list -->
