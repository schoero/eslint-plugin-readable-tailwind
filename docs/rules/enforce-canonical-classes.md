# better-tailwindcss/enforce-canonical-classes

Implements the [canonical suggestions](https://github.com/tailwindlabs/tailwindcss/pull/19059) from Tailwind CSS `^4.1.15`.
A canonical class is a simpler representation of a less optimal way of writing the same class. This can be the case when arbitrary values or variants are used while a predefined value exists for example.

> [!NOTE]
>
> - This rule is identical to `suggestCanonicalClasses` from the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) VSCode extension.  
>   It is recommended to disable `suggestCanonicalClasses` in your project's `.vscode/settings.json` to avoid confusion:
>
>   ```jsonc
>   {
>     "tailwindCSS.lint.suggestCanonicalClasses": "ignore"
>   }
>   ```
>
> - The rule covers multiple other rules.  
>   It is recommended to disable the following rules to avoid duplicate reports:
>   - [`better-tailwindcss/enforce-shorthand-classes`](./enforce-shorthand-classes.md)
>   - [`better-tailwindcss/enforce-consistent-important-position`](./enforce-consistent-important-position.md)
>   - [`better-tailwindcss/enforce-consistent-variable-syntax`](./enforce-consistent-variable-syntax.md)
>
> - The canonical suggestions are based on the internal logic of Tailwind CSS and it is possible that the suggestions can change in future versions of Tailwind CSS.
> - Configurability is also limited to what Tailwind CSS exposes via their API.
> - The rule comes with a [startup cost of around ~1s](https://github.com/tailwindlabs/tailwindcss/pull/19059#:~:text=performance).

<br/>

## Options

<br/>

### `rootFontSize`

The font size of the `<html>` element in pixels. By default, the root font size is `16px` unless it is changed with CSS.
If provided, this will be used to determine if arbitrary values can be replaced with predefined sizing scales. This can also be configured via the [`settings` object](../settings/settings.md).

**Type**: `number | undefined`  
**Default**: `undefined`

<br/>

### `collapse`

Whether to collapse multiple utilities into a single utility if possible.  
If set to `true`, it is recommended to disable the [`better-tailwindcss/enforce-shorthand-classes`](./enforce-shorthand-classes.md) rule to avoid duplicate reports.

**Type**: `boolean`  
**Default**: `true`

<br/>

### `logical`

Whether to convert between logical and physical properties when collapsing utilities.

**Type**: `boolean`  
**Default**: `true`

<br/>

### `ignore`

List of List of regex patterns for classes that should not report a canonical suggestion.

This can be useful for cases where a non-canonical class representation is intentional.

**Type**: `string[]`  
**Default**: `[]`

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

</details>

<br/>

## Examples

```tsx
// ❌ BAD: using unnecessary arbitrary value
<div class="[display:flex]" />;
```

```tsx
// ✅ GOOD: using canonical class for display flex
<div class="flex" />;
```

```tsx
// ❌ BAD: using unnecessary arbitrary data attribute variant
<div class="data-[is-selected]:opacity-100" />;
```

```tsx
// ✅ GOOD: using canonical data attribute variant
<div class="data-is-selected:opacity-100" />;
```

```tsx
// ❌ BAD: using arbitrary value for spacing
<div class="mt-[16px]" />;
```

```tsx
// ✅ GOOD: using canonical class for spacing (with rootFontSize: 16)
<div class="mt-4" />;
```

```tsx
// ❌ BAD: using multiple utilities for margin
<div class="mt-2 mr-2 mb-2 ml-2" />;
```

```tsx
// ✅ GOOD: using collapsed utility for margin (with collapse: true)
<div class="m-2" />;
```

```tsx
// ❌ BAD: using physical properties for margin
<div class="mr-2 ml-2" />;
```

```tsx
// ✅ GOOD: using logical properties for margin (with logicalToPhysical: true)
<div class="mx-2" />;
```
