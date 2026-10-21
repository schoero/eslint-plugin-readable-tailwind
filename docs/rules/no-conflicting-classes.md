# better-tailwindcss/no-conflicting-classes

Disallow conflicting classes in Tailwind CSS class strings. Conflicting classes are classes that apply the same CSS property on the same element. This can cause unexpected behavior as it is not clear which class will take precedence.

<br/>

> [!NOTE]
> This rule is similar to `cssConflict` from the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) VSCode extension. It is recommended to disable `cssConflict` in your project's `.vscode/settings.json` to avoid confusion:
>
> ```jsonc
> {
>   "tailwindCSS.lint.cssConflict": "ignore"
> }
> ```

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
// ❌ BAD: Conflicting class detected: "flex" and "grid" apply the same CSS properties: "display".
<div class="flex grid" />;
```

```tsx
// ✅ GOOD: no conflicting classes
<div class="flex w-full" />;
```
