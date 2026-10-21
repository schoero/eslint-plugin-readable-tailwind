# better-tailwindcss/no-deprecated-classes

Disallow the use of [deprecated Tailwind CSS classes](https://tailwindcss.com/docs/upgrade-guide#removed-deprecated-utilities) in Tailwind CSS v4.

The following classes will be reported as deprecated:

## Deprecated Utilities

| **Deprecated**             | **Replacement**                               |
|---------------------------|-----------------------------------------------|
| `bg-opacity-*`            | Use opacity modifiers like `bg-black/50`      |
| `text-opacity-*`          | Use opacity modifiers like `text-black/50`    |
| `border-opacity-*`        | Use opacity modifiers like `border-black/50`  |
| `divide-opacity-*`        | Use opacity modifiers like `divide-black/50`  |
| `ring-opacity-*`          | Use opacity modifiers like `ring-black/50`    |
| `placeholder-opacity-*`   | Use opacity modifiers like `placeholder-black/50` |
| `flex-shrink`             | `shrink`                                      |
| `flex-shrink-*`           | `shrink-*`                                    |
| `flex-grow`               | `grow`                                        |
| `flex-grow-*`             | `grow-*`                                      |
| `overflow-ellipsis`       | `text-ellipsis`                               |
| `decoration-slice`        | `box-decoration-slice`                        |
| `decoration-clone`        | `box-decoration-clone`                        |

## Renamed Utilities (v3 → v4)

| **v3**                    | **v4**                   |
|--------------------------|--------------------------|
| `shadow`                 | `shadow-sm`              |
| `drop-shadow`            | `drop-shadow-sm`         |
| `blur`                   | `blur-sm`                |
| `backdrop-blur`          | `backdrop-blur-sm`       |
| `rounded`                | `rounded-sm`             |

<br/>

## Options

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

```tsx
// ❌ BAD: using deprecated shadow class
<div class="shadow" />;
```

```tsx
// ✅ GOOD: using updated shadow class
<div class="shadow-sm" />;
```

```tsx
// ❌ BAD: using deprecated flex-shrink class
<div class="flex-shrink-1" />;
```

```tsx
// ✅ GOOD: using updated shrink class
<div class="shrink-1" />;
```
