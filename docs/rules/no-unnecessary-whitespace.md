# readable-tailwind/no-unnecessary-whitespace

💼⚠️ This rule is enabled in the ![error](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-error.svg) `error` config. This rule _warns_ in the ![warning](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-warning.svg) `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

<br/>

## Description

Disallow unnecessary whitespace in between and around tailwind classes.

<br/>

### Options

- `allowMultiline`

  Allow multi-line class declarations.  
  If this option is disabled, template literal strings will be collapsed into a single line string wherever possible. Must be set to `true` when used in combination with [readable-tailwind/multiline](./multiline.md).
  
  **Type**: `boolean`
  **Default**: `true`

- `callees`

  List of function names whose arguments should also be considered.
  
  **Type**: `string[] | [string, string][]`  
  **Default**: `["clsx", "cva", "ctl", "twMerge"]`
  
  Can also be a tuple of regular expressions. The first regular expression matches the whole container, the second regular expression will match the string literals. Multiple groups can be used to match multiple string literals.  
  This is inspired by [Class Variance Authority](https://cva.style/docs/getting-started/installation#intellisense).

  ```jsonc
  {
    "callees": [
      [
        // matches all arguments inside the parentheses of the cva function call
        "cva\\(([^)]*)\\)",
        // matches all string literals in matched container
        "[\"'`]([^\"'`]*).*?[\"'`]"
      ]
    ]
  }
  ```

<br/>

- `classAttributes`

  The name of the attribute that contains the tailwind classes.

  **Type**: `string[]`  
  **Default**: `["class", "className"]`

<br/>

## Examples

```tsx
// ❌ BAD: random unnecessary whitespace
<div class=" text-black    underline  hover:text-opacity-70   " />;
```

```tsx
// ✅ GOOD: only necessary whitespace is remaining
<div class="text-black underline hover:text-opacity-70"/>;
```
