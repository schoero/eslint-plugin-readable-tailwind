# Enforce a consistent order for tailwind classes (`readable-tailwind/sort-classes`)

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Options

<!-- begin auto-generated rule options list -->

| Name              | Description                                                                                                                                      | Type     | Choices                   | Default                           |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------ | :-------------------------------- |
| `callees`         | List of function names whose arguments should also be considered.                                                                                | String[] |                           | [`clsx`, `cva`, `ctl`, `twMerge`] |
| `classAttributes` |                                                                                                                                                  | String[] |                           |                                   |
| `order`           | The algorithm to use when sorting classes.                                                                                                       | String   | `asc`, `desc`, `official` | `official`                        |
| `tailwindConfig`  | The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration. | String   |                           |                                   |

<!-- end auto-generated rule options list -->
