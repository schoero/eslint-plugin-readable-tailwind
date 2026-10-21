# better-tailwindcss/enforce-consistent-class-order

Enforce the order of tailwind classes. It is possible to sort classes alphabetically or logically.

<br/>

## Options

### `order`

- `asc`: Sort classes alphabetically in ascending order.
- `desc`: Sort classes alphabetically in descending order.
- `official`: Sort classes according to the official sorting order from Tailwind CSS based on semantics.
- `strict`: Shorthand for `{ order: "official", groupBy: "variant" }`. If [`groupBy`](#groupby) is set as well, it takes precedence over the variant grouping.

  When classes are grouped via [`groupBy`](#groupby), `asc` and `desc` compare classes by their base class, ignoring variants, the prefix and negative and important modifiers. They also respect the component and unknown class options below.

  **Type**: `"asc" | "desc" | "official" | "strict"`  
  **Default**: `"official"`

<br/>

### `groupBy`

  Defines how classes should be grouped. Classes within a group are sorted according to the [`order`](#order) option.

- `none`: Don't group classes.
- `variant`: Group classes by their variants:
  - Classes that share the same base variants get grouped together.
  - Classes with less variants come before classes with more variants.
  - Classes with arbitrary variants come last.
  - Variant groups are sorted in the official variant order for `official` and alphabetically for `asc` and `desc`.
- `property`: Group classes by the CSS properties they set, so that a class is followed by the variant classes that override it:
  - Classes that set exactly the same CSS properties, ignoring their variants, get grouped together.
  - Each group is placed at the position of its first class. Classes within a group are sorted by their variants like with `variant`.
  - Classes that don't set any CSS properties, like unknown and component classes, keep their position.
  - Only supported in Tailwind CSS v4. In Tailwind CSS v3, classes are not grouped.

  Use the same value for the [`groupBy`](./enforce-consistent-line-wrapping.md#groupby) option of `enforce-consistent-line-wrapping` to put each group on its own line.

  **Type**: `"none" | "property" | "variant"`  
  **Default**: `"none"`

<br/>

### `detectComponentClasses`

  Tailwind CSS v4 allows you to define custom [component classes](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes) like `card`, `btn`, `badge` etc.
  
  If you want to create such classes, you can set this option to `true` to allow the rule to detect those classes and not report them as unknown classes. This can also be configured via the [`settings` object](../settings/settings.md).

  **Type**: `boolean`  
  **Default**: `false`

<br/>

### `componentClassOrder`

  Defines how component classes should be ordered among themselves.

- `asc`: Sort component classes alphabetically in ascending order.
- `desc`: Sort component classes alphabetically in descending order.
- `preserve`: Keep component classes in their original order.

  **Type**: `"asc" | "desc" | "preserve"`  
  **Default**: `"preserve"`

<br/>

### `componentClassPosition`

  Defines where component classes should be placed in relation to the whole string literal.

- `start`: Place component classes at the beginning.
- `end`: Place component classes at the end.

  **Type**: `"start" | "end"`  
  **Default**: `"start"`

<br/>

### `unknownClassOrder`

  Defines how unknown classes should be ordered among themselves.

- `asc`: Sort unknown classes alphabetically in ascending order.
- `desc`: Sort unknown classes alphabetically in descending order.
- `preserve`: Keep unknown classes in their original order.

  **Type**: `"asc" | "desc" | "preserve"`  
  **Default**: `"preserve"`

<br/>

### `unknownClassPosition`

  Defines where unknown classes should be placed in relation to the whole string literal.

- `start`: Place unknown classes at the beginning.
- `end`: Place unknown classes at the end.

  **Type**: `"start" | "end"`  
  **Default**: `"start"`

<br/>

### `ungroupedClassOrder`

  Defines how ungrouped classes should be ordered among themselves. A class is ungrouped if it is the only class in its group when classes are grouped via [`groupBy`](#groupby). Unknown and component classes are not part of any group and are ordered by their own options.

- `asc`: Sort ungrouped classes alphabetically in ascending order.
- `desc`: Sort ungrouped classes alphabetically in descending order.
- `preserve`: Keep ungrouped classes in their original order.

  **Type**: `"asc" | "desc" | "preserve"`  
  **Default**: `"preserve"`

<br/>

### `ungroupedClassPosition`

  Defines where ungrouped classes should be placed in relation to the groups. Has no effect without [`groupBy`](#groupby).

- `start`: Place ungrouped classes before the groups.
- `end`: Place ungrouped classes after the groups.
- `preserve`: Keep ungrouped classes at their position.

  Use the [`combineUngroupedClasses`](./enforce-consistent-line-wrapping.md#combineungroupedclasses) option of `enforce-consistent-line-wrapping` to put them on a shared line.

  **Type**: `"start" | "end" | "preserve"`  
  **Default**: `"preserve"`

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
// ❌ BAD: all classes are in random order
<div class="underline hover:text-opacity-70 focus:font-bold text-black hover:font-bold focus:text-opacity-70"/>;
```

```tsx
// ✅ GOOD: with option { order: 'asc' }
<div class="focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70 text-black underline"/>;
```

```tsx
// ✅ GOOD: with option { order: 'desc' }
<div class="underline text-black hover:text-opacity-70 hover:font-bold focus:text-opacity-70 focus:font-bold"/>;
```

```tsx
// ✅ GOOD: with option { order: 'official' }
<div class="text-black underline hover:font-bold hover:text-opacity-70 focus:font-bold focus:text-opacity-70"/>;
```

```tsx
// ✅ GOOD: with option { order: 'asc', groupBy: 'variant' }
<div class="mb-1 -mt-2 p-4 focus:ring hover:underline"/>;
```

```tsx
// ✅ GOOD: with option { order: 'official', groupBy: 'variant' } or { order: 'strict' }
<div class="text-black hover:text-black hover:dark:text-black"/>;
```

```tsx
// ✅ GOOD: with option { groupBy: 'property' }
<div class="flex flex-col md:flex-row gap-2 md:gap-6 px-4 md:px-8 py-3 text-sm md:text-base"/>;
```

```tsx
// ✅ GOOD: with option { groupBy: 'property', ungroupedClassPosition: 'start' }
<div class="flex py-3 flex-col md:flex-row gap-2 md:gap-6 px-4 md:px-8 text-sm md:text-base"/>;
```

```tsx
// ✅ GOOD: with option { componentClassPosition: 'start' }
// 'btn' and 'card' are defined as component classes in the tailwind config
<div class="btn card text-black underline"/>;
```

```tsx
// ✅ GOOD: with option { componentClassPosition: 'end' }
// 'btn' and 'card' are defined as component classes in the tailwind config
<div class="text-black underline btn card"/>;
```

```tsx
// ✅ GOOD: with option { unknownClassPosition: 'start' }
// 'unknown-class' is not defined in the tailwind config
<div class="unknown-class text-black underline"/>;
```

```tsx
// ✅ GOOD: with option { unknownClassPosition: 'end' }
// 'unknown-class' is not defined in the tailwind config
<div class="text-black underline unknown-class"/>;
```
