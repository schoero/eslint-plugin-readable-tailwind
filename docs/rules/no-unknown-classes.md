# better-tailwindcss/no-unknown-classes

Disallow unknown classes in Tailwind CSS class strings. Unknown classes are classes that are not defined in your Tailwind CSS config file and therefore not recognized by Tailwind CSS.

<br/>

## Options

### `ignore`

  List of List of regex patterns for classes that should not report an error.
  
  **Type**: `string[]`  
  **Default**: `[]`

<br/>

### `detectComponentClasses`

  Tailwind CSS v4 allows you to define custom [component classes](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes) like `card`, `btn`, `badge` etc.
  
  If you want to create such classes, you can set this option to `true` to allow the rule to detect those classes and not report them as unknown classes. This can also be configured via the [`settings` object](../settings/settings.md).
  
  **Type**: `boolean`  
  **Default**: `false`

<br/>

### `detectSvelteStyleClasses`

  Treat class selectors declared in a Svelte component's `<style>` block as known classes for that component.

  The option only has an effect in `.svelte` files. If the `<style>` block cannot be parsed, or it uses a style language that `svelte-eslint-parser` cannot parse, no classes are detected from it.

  **Type**: `boolean`  
  **Default**: `false`

  This is useful when a `.svelte` file mixes Tailwind classes with local component classes:

  ```svelte
  <style>
    .card {
      border-radius: 0.5rem;
    }
  </style>

  <div class="card flex" />
  ```

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
// ❌ BAD: unknown class
<div class="my-class" />;
```

```tsx
// ✅ GOOD: only valid tailwindcss classes
<div class="font-bold hover:underline" />;
```
