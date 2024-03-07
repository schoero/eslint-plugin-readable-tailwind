# readable-tailwind/multiline

Enforce tailwind classes to be broken up into multiple lines. It is possible to break at a certain print width or a certain number of classes per line.

<br/>

## Options

- `classesPerLine`

  The maximum amount of classes per line. Lines are wrapped appropriately to stay within this limit . The value `0` disables line wrapping by `classesPerLine`.

  **Type**: `number`  
  **Default**: `0`

<br/>

- `group`

  The group separator.

  **Type**: `"emptyLine" | "never" | "newLine"`  
  **Default**: `emptyLine`  

<br/>

- `indent`

  Determines how the code should be indented.

  **Type**: `number | "tab"`
  **Default**: `2`

<br/>

- `printWidth`

  The maximum line length. Lines are wrapped appropriately to stay within this limit. The value `0` disables line wrapping by `printWidth`.

  **Type**: `number`
  **Default**: `80`

<br/>

- `classAttributes`

  The name of the attribute that contains the tailwind classes.

  **Type**: `string[]`  
  **Default**: `["class", "className"]`

<br/>

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

- `variables`

  List of variable names whose initializer should also be considered.
  
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

With the default options, a class name will be broken up into multiple lines and grouped by their modifiers. Groups are separated by an empty line.  

The following examples show how the rule behaves with different options:

```tsx
// ❌ BAD
<div class="text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70" />;
```

```tsx
// ✅ GOOD: with option { group: 'emptyLine' }
<div class={`
  text-black underline

  focus:font-bold focus:text-opacity-70

  hover:font-bold hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with option { group: 'newLine' }
<div class={`
  text-black underline
  focus:font-bold focus:text-opacity-70
  hover:font-bold hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with option { group: 'never', printWidth: 80 }
<div class={`
  text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold
  hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with { classesPerLine: 1, group: 'emptyLine' }
<div class={`
  text-black
  underline

  focus:font-bold
  focus:text-opacity-70

  hover:font-bold
  hover:text-opacity-70
`} />;
```
