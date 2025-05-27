# Advanced Configuration

The [rules](../../README.md#rules) in this plugin lint string literals that contain Tailwind CSS classes. To do this accurately, the plugin needs to know which strings actually contain Tailwind classes. Otherwise it would try to lint every string literal, leading to false errors and potentially broken code.

By default, the plugin is configured to work with [most popular tailwind utilities](../../README.md#utilities).  

It is possible to override the default configuration by defining the `attributes`, `callees`, `variables` or `tags` option for each rule individually, or globally via the [settings](../configuration/settings.md) object in ESLint.

In order to extend the default configuration instead of overriding it, you can import the default options from `eslint-plugin-better-tailwindcss/api/defaults` and merge them with your own config.

You can read more about the default configuration in the [defaults documentation](../api/defaults.md).

<br/>
<br/>

## Name based matching

The simplest way to tell the plugin what to lint is by a name.

If an `attribute`, `variable`, `callee` or `tag` matches one of the names you define, its string literals will be linted.

### How names work

- Names are treated as regular expressions
- Reserved characters in regular expressions must be escaped.
- The regular expression must match the whole name. Partial matches are ignored.

<br/>

### Type

```ts
type Name = string;
```

<br/>

### Examples

```jsonc
{
  "attributes": [
    "myAttribute",
    ".*Classes"
  ]
}
```

```tsx
<img myAttribute="this will get linted" myClasses="this will get linted" />;
```

<br/>

```jsonc
{
  "callees": [
    "myFunction",
    ".*Styles"
  ]
}
```

```tsx
const name = myFunction("this will get linted");
const regex = myStyles("this will get linted");
```

<br/>

```jsonc
{
  "variables": [
    "myVariable",
    ".*Styles"
  ]
}
```

```tsx
const myVariable = "this will get linted";
const myStyles = "this will get linted";
```

<br/>
<br/>

## Matchers

For more advanced use cases, you can define matchers. Matchers let you target string literals based on their structure or context, not just their name.

Matchers are defined as a tuple of a name and a list of configurations for predefined matchers.

### How matchers work

- Names are treated as regular expressions
- Reserved characters in regular expressions must be escaped.
- The regular expression must match the whole name. Partial matches are ignored.

<br/>

### Type

```ts
type Matchers = [
  name: string,
  configurations: {
    match: "objectKeys" | "objectValues" | "strings";
    pathPattern?: string;
  }[]
][];
```

<br/>

### Types of matchers

There are currently 3 types of matchers:

- `objectKeys`: matches all object keys
- `objectValues`: matches all object values
- `strings`: matches all string literals that are not object keys or values

<br/>

### Path pattern

It is possible to narrow down which keys/values are matched by providing a `pathPattern` to the `objectKeys` and `objectValues` matchers, to only match keys/values that match the `pathPattern`.

This is especially useful for libraries like [Class Variance Authority (cva)](https://cva.style/docs/getting-started/installation#intellisense), where class names appear in nested object structures.

The `pathPattern` is a regular expression that is matched against the object path.  

For example, the following matcher will only match object values for the `compoundVariants.class` key:

<br/>

```json
{
  "match": "objectValues",
  "pathPattern": "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
}
```

```tsx
<img class={
  cva("this will not get linted", {
    compoundVariants: [
      {
        class: "but this will get linted",
        myVariant: "and this will not get linted"
      }
    ]
  })
} />;
```

<br/>

The path reflects how the string is nested in the object:

- Dot notation for plain keys: `root.nested.values`
- Square brackets for arrays: `values[0]`
- Quoted brackets for special characters: `root["some-key"]`

For example, the object path for the `value` key in the following object would be `root["nested-key"].values[0].value`:

```json
{
  "root": {
    "nested-key": {
      "values": [
        {
          "value": "this will get linted"
        }
      ]
    }
  }
}
```

<br/>

### Examples

```jsonc

{
  "callees": [
    [
      "cva", [
        {
          "match": "strings"
        },
        {
          "match": "objectValues",
          "pathPattern": "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
        }
      ]
    ]
  ]
}
```

```tsx
<img class={
  cva("this will get linted", {
    compoundVariants: [
      {
        class: "and this will get linted",
        myVariant: "but this will not get linted"
      }
    ]
  })
} />;
```
