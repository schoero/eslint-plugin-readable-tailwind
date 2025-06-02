# better-tailwindcss/enforce-consistent-variable-syntax

Enforce consistent css variable syntax in tailwindcss class strings.

<br/>

## Options

### `syntax`

  The syntax to enforce for css variables in tailwindcss class strings.

  **Type**: `"arbitrary"` | `"parentheses"`  
  **Default**: `"parentheses"`

### `attributes`

  The name of the attribute that contains the tailwind classes. This can also be set globally via the [`settings` object](../settings/settings.md#attributes).  

  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**: [Name](../configuration/advanced.md#name-based-matching) for `"class"` and [strings Matcher](../configuration/advanced.md#types-of-matchers) for `"class", "className"`

<br/>

### `callees`

  List of function names which arguments should also get linted. This can also be set globally via the [`settings` object](../settings/settings.md#callees).  
  
  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**: [Matchers](../configuration/advanced.md#types-of-matchers) for `"cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"`

<br/>

### `variables`

  List of variable names whose initializer should also get linted. This can also be set globally via the [`settings` object](../settings/settings.md#variables).  
  
  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**:  [strings Matcher](../configuration/advanced.md#types-of-matchers) for `"className", "classNames", "classes", "style", "styles"`

<br/>

### `tags`

  List of template literal tag names whose content should get linted. This can also be set globally via the [`settings` object](../settings/settings.md#tags).  
  
  **Type**: Array of [Matchers](../configuration/advanced.md)  
  **Default**: None

  Note: When using the `tags` option, it is recommended to use the [strings Matcher](../configuration/advanced.md#types-of-matchers) for your tag names. This will ensure that nested expressions get linted correctly.

<br/>

## Examples

```tsx
// ❌ BAD: Incorrect css variable syntax with option `syntax: "parentheses"`
<div class="bg-[var(--primary)]" />;
```

```tsx
// ✅ GOOD: With option `syntax: "parentheses"`
<div class="bg-(--primary)" />;
```

```tsx
// ❌ BAD: Incorrect css variable syntax with option `syntax: "arbitrary"`
<div class="bg-(--primary)" />;
```

```tsx
// ✅ GOOD: With option `syntax: "arbitrary"`
<div class="bg-[var(--primary)]" />;
```
