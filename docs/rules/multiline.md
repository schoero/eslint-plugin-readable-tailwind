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

- `lineBreakStyle`

  The line break style.  
  The style `windows` will use `\r\n` as line breaks and `unix` will use `\n`.

  **Type**: `"windows" | "unix"`  
  **Default**: `"unix"`

<br/>

- `printWidth`

  The maximum line length. Lines are wrapped appropriately to stay within this limit. The value `0` disables line wrapping by `printWidth`.

  **Type**: `number`  
  **Default**: `80`

<br/>

- `classAttributes`

  The name of the attribute that contains the tailwind classes.

  **Type**: Array of [Name](../concepts/name.md),[Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**: [strings Matcher](../concepts/matchers.md#types-of-matchers) for `"class", "className"`

<br/>

- `callees`

  List of function names which arguments should also get linted.
  
  **Type**: Array of [Name](../concepts/name.md),[Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**: [Matchers](../concepts/matchers.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

- `variables`

  List of variable names which initializer should also get linted.
  
  **Type**: Array of [Name](../concepts/name.md),[Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**:  [strings Matcher](../concepts/matchers.md#types-of-matchers) for`"className", "classNames", "classes", "style", "styles"`

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
