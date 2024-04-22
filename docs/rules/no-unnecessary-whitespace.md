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

  **Type**: Array of [Name](../concepts/name.md), [Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**: [strings Matcher](../concepts/matchers.md#types-of-matchers) for `"class", "className"`

<br/>

- `callees`

  List of function names which arguments should also get linted.
  
  **Type**: Array of [Name](../concepts/name.md), [Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**: [Matchers](../concepts/matchers.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

- `variables`

  List of variable names which initializer should also get linted.
  
  **Type**: Array of [Name](../concepts/name.md), [Regex](../concepts/regex.md) or [Matchers](../concepts/matchers.md)  
  **Default**:  [strings Matcher](../concepts/matchers.md#types-of-matchers) for`"className", "classNames", "classes", "style", "styles"`

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
