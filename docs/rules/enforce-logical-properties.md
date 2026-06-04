# better-tailwindcss/enforce-logical-properties

Enforce logical utility class names over physical directions for better RTL and LTR support.

The rule reports physical classes and auto-fixes them to their logical equivalent when a direct Tailwind replacement exists.

## Physical to Logical Mappings

| **Physical** | **Logical** |
| :--- | :--- |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `pt-*` | `pbs-*` |
| `pb-*` | `pbe-*` |
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `mt-*` | `mbs-*` |
| `mb-*` | `mbe-*` |
| `scroll-pl-*` | `scroll-ps-*` |
| `scroll-pr-*` | `scroll-pe-*` |
| `scroll-pt-*` | `scroll-pbs-*` |
| `scroll-pb-*` | `scroll-pbe-*` |
| `scroll-ml-*` | `scroll-ms-*` |
| `scroll-mr-*` | `scroll-me-*` |
| `scroll-mt-*` | `scroll-mbs-*` |
| `scroll-mb-*` | `scroll-mbe-*` |
| `left-*` | `inset-s-*` |
| `right-*` | `inset-e-*` |
| `top-*` | `inset-bs-*` |
| `bottom-*` | `inset-be-*` |
| `border-l` / `border-l-*` | `border-s` / `border-s-*` |
| `border-r` / `border-r-*` | `border-e` / `border-e-*` |
| `border-t` / `border-t-*` | `border-bs` / `border-bs-*` |
| `border-b` / `border-b-*` | `border-be` / `border-be-*` |
| `rounded-l` / `rounded-l-*` | `rounded-s` / `rounded-s-*` |
| `rounded-r` / `rounded-r-*` | `rounded-e` / `rounded-e-*` |
| `rounded-tl` / `rounded-tl-*` | `rounded-ss` / `rounded-ss-*` |
| `rounded-tr` / `rounded-tr-*` | `rounded-se` / `rounded-se-*` |
| `rounded-br` / `rounded-br-*` | `rounded-ee` / `rounded-ee-*` |
| `rounded-bl` / `rounded-bl-*` | `rounded-es` / `rounded-es-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `float-left` | `float-start` |
| `float-right` | `float-end` |
| `clear-left` | `clear-start` |
| `clear-right` | `clear-end` |
| `h-*` | `block-*` |
| `w-*` | `inline-*` |
| `min-h-*` | `min-block-*` |
| `min-w-*` | `min-inline-*` |
| `max-h-*` | `max-block-*` |
| `max-w-*` | `max-inline-*` |
| `size-*` | `block-* inline-*` |

<br/>

## Options

<br/>

### `ignore`

List of regex patterns for classes that should not report logical property suggestions.

This can be useful for classes that intentionally use physical directions.

**Type**: `string[]`
**Default**: `[]`

<br/>

<details>
  <summary>Common options</summary>

  <br/>

  These options are common to all rules and can also be set globally via the [settings object](../settings/settings.md).

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

  Tailwind config file path.

  **Type**: string
  **Default**: Tailwind's default config resolution

  <br/>

### `tsconfig`

  The path to the `tsconfig.json` file. If not specified, the plugin will try to find it automatically.
  This can also be set globally via the [settings object](../settings/settings.md#tsconfig).

  The tsconfig is used to resolve tsconfig [path](https://www.typescriptlang.org/tsconfig/#paths) aliases.

  **Type**: `string`
  **Default**: `undefined`

</details>

<br/>

## Examples

```tsx
// ❌ BAD: physical direction classes
<div class="pl-4 pt-2 mr-2 mt-1 text-left rounded-tr-lg right-0 top-0 border-t" />;
```

```tsx
// ✅ GOOD: logical direction classes
<div class="ps-4 pbs-2 me-2 mbs-1 text-start rounded-se-lg inset-e-0 inset-bs-0 border-bs" />;
```
