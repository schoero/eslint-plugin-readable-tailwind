# Settings

## Table of Contents

- [entryPoint](#entrypoint)
- [tailwindConfig](#tailwindconfig)
- [tsconfig](#tsconfig)
- [cwd](#cwd)
- [detectComponentClasses](#detectcomponentclasses)
- [rootFontSize](#rootfontsize)
- [cacheSize](#cachesize)
- [messageStyle](#messagestyle)
- [selectors](#selectors)

<br />
<br />

The settings object can be used to globally configure shared options across all rules. Global options will always be overridden by rule-specific options.
To set the settings object, add a `settings` key to the eslint config.

<br />
<br />

```jsonc
// eslint.config.js
{
  // "plugins": {... },
  // "rules": { ... },
  "settings": {
    "better-tailwindcss": {
      // ...
    }
  }
}
```

For TypeScript configurations, import the public `Settings` type:

```ts
import type { Settings } from "eslint-plugin-better-tailwindcss/api/types";

const tailwindSettings = {
  entryPoint: "src/global.css"
} satisfies Settings;

export default [
  {
    settings: {
      "better-tailwindcss": tailwindSettings
    }
  }
];
```

<br />
<br />

### `entryPoint`

  The path to the entry file of the css based tailwind config (eg: `src/global.css`). If not specified, the plugin will fall back to the default configuration. Relative to the [current working directory](#cwd).  
  The tailwind config is used for various rules.

  **Type**: `string`

<br/>

### `tailwindConfig`

  The path to the `tailwind.config.js` file. If not specified, the plugin will try to find it automatically or falls back to the default configuration. Relative to the [current working directory](#cwd).  
  The tailwind config is used for various rules.

  For Tailwind CSS v4 and the css based config, use the [`entryPoint`](#entrypoint) option instead.

  **Type**: `string`
  
<br/>

### `tsconfig`

  The path to the `tsconfig.json` file. If not specified, the plugin will try to find it automatically.  
  Relative to the [current working directory](#cwd).  

  The tsconfig is used to resolve tsconfig [`path`](https://www.typescriptlang.org/tsconfig/#paths) aliases.

  **Type**: `string`  
  **Default**: `undefined`

<br/>

### `cwd`

  The working directory used to resolve `tailwindcss` and related config files. This is useful for monorepos where linting runs from the repository root but each project has its own `node_modules` and Tailwind setup.

  This path is resolved relative to the current working directory of the ESLint process. If not specified, it falls back to the current working directory of the ESLint process.

  **Type**: `string`  
  **Default**: `undefined`

<br/>

### `detectComponentClasses`

  Tailwind CSS v4 allows you to define custom [component classes](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes) like `card`, `btn`, `badge` etc.
  
  If you want to create such classes, you can set this option to `true` to allow the rule to detect those classes and not report them as unknown classes.
  
  **Type**: `boolean`  
  **Default**: `false`

<br/>

### `rootFontSize`

The font size of the `<html>` element in pixels. By default, the root font size is `16px` unless it is changed with CSS.
If provided, this will be used to determine if arbitrary values can be replaced with predefined sizing scales.

**Type**: `number | undefined`  
**Default**: `undefined`

<br/>

### `cacheSize`

  The maximum memory in megabytes the plugin may use to cache Tailwind CSS results. The cache is shared with the worker that runs Tailwind CSS and grows as needed up to this size. Beyond that, the least recently used entries are evicted and recomputed when they are needed again.

  The cache is shared by all rules. If different values are configured, the first one applies and later ones only if they are larger. It is therefore best set in the global settings.

  **Type**: `number`  
  **Default**: `32`

<br/>

### `messageStyle`

  Customize how linting messages are displayed.
  
  `"visual"` visualizes whitespaces and line breaks for better readability.  
  `"compact"` displays visual message on a single line, better suitable for CI environments.  
  `"raw"` shows only the raw information without whitespace or line break visualization.  

  **Type**: `"visual" | "compact" | "raw"`  
  **Default**: `"visual"`, `"compact"` in CI environments

<br/>

### `selectors`

  Flat list of selectors that determines where Tailwind class strings are linted.

  This controls what gets linted globally: only string literals matched by these selectors are treated as Tailwind class candidates.

  **Type**: Array of [Selectors](../configuration/advanced.md#selectors)  
  **Default**: See [defaults API](../api/defaults.md)
