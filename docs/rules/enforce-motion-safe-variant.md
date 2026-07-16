# better-tailwindcss/enforce-motion-safe-variant

Enforce the `motion-safe` variant for transition and animation classes. This rule helps ensure that motion-related CSS classes are properly wrapped with the `motion-safe` variant to respect user preferences for reduced motion.

Users who prefer reduced motion may have their browser or operating system configured to minimize unnecessary animations. By requiring the `motion-safe` variant, you ensure that transition and animation classes only apply when the user has not expressed a preference for reduced motion.

<br/>

## Options

### `allowMotionReduce`

Suppress warnings for a literal that already contains a class with the `motion-reduce` variant. This allows you to handle motion-related effects either with `motion-safe` or `motion-reduce`.

**Type**: `boolean`  
**Default**: `false`

<br/>

### `classes`

A list of regular expression patterns for classes that require the `motion-safe` variant. This allows you to customize which classes trigger this rule.

**Type**: `string[]`  
**Default**: `["^transition(-.*)?$", "^animate(-.*)?$"]`

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

### Missing motion-safe variant

```html
// ❌ BAD
<div class="transition-colors"></div>
<div class="animate-spin"></div>
```

```html
// ✅ GOOD
<div class="motion-safe:transition-colors"></div>
<div class="motion-safe:animate-spin"></div>
```

### With other variants

```html
// ❌ BAD: motion-safe is missing
<div class="hover:transition-colors"></div>
<div class="dark:animate-spin"></div>
```

```html
// ✅ GOOD: motion-safe can be combined with other variants
<div class="dark:motion-safe:transition-colors"></div>
<div class="motion-safe:hover:animate-spin"></div>
<div class="lg:dark:motion-safe:transition-all"></div>
```

### Using motion-reduce alternative

```html
// ✅ GOOD: with option { "allowMotionReduce": true }
<div class="motion-reduce:transition-none transition-all"></div>
<div class="motion-reduce:animate-none animate-spin"></div>
```

In this case, the rule allows motion classes without the `motion-safe` variant because `motion-reduce` is present, providing an explicit alternative for users who prefer reduced motion.
