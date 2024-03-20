# readable-tailwind/no-unnecessary-whitespace

Disallow unnecessary whitespace in between and around tailwind classes.

<br/>

## Options

- `allowMultiline`

  Allow multi-line class declarations.  
  If this option is disabled, template literal strings will be collapsed into a single line string wherever possible. Must be set to `true` when used in combination with [readable-tailwind/multiline](./multiline.md).
  
  **Type**: `boolean`  
  **Default**: `true`

<br/>

- `classAttributes`

  The name of the attribute that contains the tailwind classes.

  **Type**: `string[]`  
  **Default**: `["class", "className"]`

<br/>

- `callees`

  List of function names whose arguments should also get linted.
  
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

- `variables`

  List of variable names whose initializer should also get linted.
  
  **Type**: `string[] | [string, string][]`  
  **Default**: `["className", "classNames", "classes", "style", "styles"]`
  
  Can also be a tuple of regular expressions. The first regular expression matches the whole container, the second regular expression will match the string literals. Multiple groups can be used to match multiple string literals.  
  This is inspired by [Class Variance Authority](https://cva.style/docs/getting-started/installation#intellisense).

  ```jsonc
  {
    "callees": [
      [
        // matches the right side of the assignment
        "myVariable = ([\\S\\s]*)",
        // matches everything inside the quotes
        "^\\s*[\"'`]([^\"'`]+)[\"'`]"
      ]
    ]
  }
  ```

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
