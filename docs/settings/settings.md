# Settings

## Table of Contents

- [entryPoint](#entrypoint)
- [tailwindConfig](#tailwindconfig)
- [attributes](#attributes)
- [callees](#callees)
- [variables](#variables)
- [tags](#tags)

<br />
<br />

The settings object can be used to globally configure shared options across all rules. Global options will always be overridden by rule-specific options.
To set the settings object, add a `settings` key to the eslint config.

<br />
<br />

```jsonc
{
  "plugins": { /* ... */ },
  "rules": { /* ... */ },
  "settings": {
    "better-tailwindcss": {
      "entryPoint": "...",
      "tailwindConfig": "...",
      "attributes": [/* ... */],
      "callees": [/* ... */],
      "variables": [/* ... */],
      "tags": [/* ... */]
    }
  }
}
```

<br />
<br />

### `entryPoint`

  The path to the entry file of the css based tailwind config (eg: `src/global.css`). If not specified, the plugin will fall back to the default configuration.  
  The tailwind config is used to determine the sorting order.

  **Type**: String

<br/>

### `tailwindConfig`

  The path to the `tailwind.config.js` file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.  
  The tailwind config is used to determine the sorting order.

  For tailwindcss v4 and the css based config, use the [`entryPoint`](#entrypoint) option instead.

  **Type**: String

<br/>

### `attributes`

  The name of the attribute that contains the tailwind classes.  

  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**: [Name](../concepts/concepts.md#name) for `"class"` and [strings Matcher](../concepts/concepts.md#types-of-matchers) for `"class", "className"`

<br/>

### `callees`

  List of function names which arguments should also get linted.  
  
  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**: [Matchers](../concepts/concepts.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

### `variables`

  List of variable names whose initializer should also get linted.  
  
  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**:  [strings Matcher](../concepts/concepts.md#types-of-matchers) for `"className", "classNames", "classes", "style", "styles"`

<br/>

### `tags`

  List of template literal tag names whose content should get linted.  
  
  **Type**: Array of [Name](../concepts/concepts.md#name), [Regex](../concepts/concepts.md#regular-expressions) or [Matchers](../concepts/concepts.md#matchers)  
  **Default**: None

  Note: When using the `tags` option, it is recommended to use the [strings Matcher](../concepts/concepts.md#types-of-matchers) for your tag names. This will ensure that nested expressions get linted correctly.
