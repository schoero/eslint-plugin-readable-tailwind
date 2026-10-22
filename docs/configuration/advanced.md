# Advanced Configuration

The [rules](../../README.md#rules) in this plugin lint Tailwind classes inside string literals.

To do that safely, the plugin must know **which strings are expected to contain Tailwind classes**. If it would lint every string literal in your codebase, it would produce many false positives and potentially unsafe fixes.

To configure this, you can provide an array of [selectors](#selectors) that specify where the plugin should look for class strings and how to extract them.

The plugin already ships with defaults that support [most popular tailwind utilities](../../README.md#utilities). You only need advanced configuration when:

- you use custom utilities/APIs not covered by defaults,
- you want to narrow down linting behavior,
- or you want to lint additional locations.

To extend defaults instead of replacing them, pass your selectors as `selectors: { extend: [...] }`. To filter or reorder the defaults, import and spread `getDefaultSelectors()` from `eslint-plugin-better-tailwindcss/defaults` into a `selectors` array instead.

You can find the default selectors in the [defaults documentation](../api/defaults.md).

<br/>
<br/>

## Selectors

Each selector targets one kind of source location and tells the plugin how to extract class strings from it.

The plugin supports four selector types: `attribute`, `callee`, `variable`, and `tag`.
Every selector can then match different types of string literals based on the provided `match` option.

### Type

<br/>

### `attribute`

- **kind**: `"attribute"`.  
- **name**: regular expression for attribute names.  
- **match** `optional`: [selector matcher](#selector-matcher-types) list.  
  When omitted, only direct string literals are collected.  

```ts
type AttributeSelector = {
  kind: "attribute";
  name: string;
  match?: SelectorMatcher[];
};
```

<br/>

### `callee`

- **kind**: `"callee"`.  
- **name** `optional`: regular expression for callee names.  
- **path** `optional`: regular expression for callee member paths like `classes.push`.  
  When `path` is provided, `name` is not required.  
- **targetCall** `optional`: curried call target for example for `fn()("my classes")`.  
  If a non-negative number is provided, the zero-based call index is used.  
  Negative numbers count from the end (`-1` is the last call).  
  When omitted, the first call in a curried chain is used.  
- **targetArgument** `optional`: target specific call arguments.  
  If a non-negative number is provided, the zero-based argument index is used.  
  Negative numbers count from the end (`-1` is the last argument).  
  When omitted, all arguments of the selected call are checked.  
- **match** `optional`: [selector matcher](#selector-matcher-types) list.  
  When omitted, only direct string literals are collected.  

```ts
type CalleeSelector = {
  kind: "callee";
  match?: SelectorMatcher[];
  name?: string;
  path?: string;
  targetArgument?: "all" | "first" | "last" | number;
  targetCall?: "all" | "first" | "last" | number;
};
```

<br/>

### `variable`

- **kind**: `"variable"`.  
- **name**: regular expression for variable names.  
  Tip: The name `default` targets the `export default ...` declaration.  
- **match** `optional`: [selector matcher](#selector-matcher-types) list.  
  When omitted, only direct string literals are collected.  
  Use an [`anonymousFunctionReturn`](#anonymousfunctionreturn) matcher to lint the value returned from a function assigned to the variable or exported as default.  

```ts
type VariableSelector = {
  kind: "variable";
  name: string;
  match?: SelectorMatcher[];
};
```

```json
{
  "selectors": [
    {
      "kind": "variable",
      "name": "^default$",
      "match": [
        {
          "type": "anonymousFunctionReturn",
          "match": [{ "type": "objectValues" }]
        }
      ]
    }
  ]
}
```

Matches:

```ts
export default options => ({
  label: "this will get linted",
  root: "this will get linted"
});
```

<br/>

### `tag`

- **kind**: `"tag"`.  
- **name**: `optional` regular expression for tagged template names.  
- **path** `optional`: regular expression for tagged template member paths like `twc.class`.  
  When `path` is provided, `name` is not required.  
- **match** `optional`: [selector matcher](#selector-matcher-types) list.  
  When omitted, only direct string literals are collected.  

```ts
type TagSelector = {
  kind: "tag";
  name: string;
  match?: SelectorMatcher[];
};
```

<br/>

### How selector matching works

- Names are treated as regular expressions.
- Reserved regex characters must be escaped.
- The regex must match the whole name (not a substring).

```jsonc
{
  "selectors": [
    {
      "kind": "callee",
      "path": "^classes\\.push$",
      "match": [{ "type": "strings" }]
    }
  ]
}
```

<br/>
<br/>

### Matchers

#### Selector matcher types

##### `strings`

Matches all string literals that are not object keys or object values.

```ts
type SelectorStringMatcher = {
  type: "strings";
};
```

```json
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^tw$",
      "match": [
        { "type": "strings" }
      ]
    }
  ]
}
```

Matches:

```tsx
tw(
  "this will get linted",
  { className: "this will not get linted by this matcher" }
);
```

<br />

##### `objectKeys`

Matches all object keys.

- `path` `optional`: regular expression to narrow matching to specific object key paths
  See [Path option details](#path-option-details).

```ts
type SelectorObjectKeyMatcher = {
  type: "objectKeys";
  path?: string;
};
```

```json
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^tw$",
      "match": [
        {
          "type": "objectKeys",
          "path": "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
        }
      ]
    }
  ]
}
```

Matches:

```tsx
tw({
  compoundVariants: [
    {
      className: "<- this key will get linted",
      myVariant: "but this key will not get linted"
    }
  ]
});
```

<br />

##### `objectValues`

Matches all object values.

- `path` `optional`: regular expression to narrow matching to specific object value paths
  See [Path option details](#path-option-details).
  
```ts
type SelectorObjectValueMatcher = {
  type: "objectValues";
  path?: string;
};
```

```json
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^tw$",
      "match": [
        {
          "type": "objectValues",
          "path": "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
        }
      ]
    }
  ]
}
```

Matches:

```tsx
tw({
  compoundVariants: [
    {
      className: "this value will get linted",
      myVariant: "but this value will not get linted"
    }
  ]
});
```

<br />

##### `anonymousFunctionReturn`

Matches values returned from anonymous functions and applies nested matchers to those return values.

- `match` `required`: nested matcher array  
  The nested `match` array can include `strings`, `objectKeys`, and `objectValues` matchers.  

```ts
type SelectorAnonymousFunctionReturnMatcher = {
  match: (SelectorObjectKeyMatcher | SelectorObjectValueMatcher | SelectorStringMatcher)[];
  type: "anonymousFunctionReturn";
};
```

```json
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^tw$",
      "match": [
        {
          "type": "anonymousFunctionReturn",
          "match": [
            { "type": "strings" },
            { "type": "objectKeys" },
            { "type": "objectValues" }
          ]
        }
      ]
    }
  ]
}
```

Matches:

```tsx
tw(() => "this will get linted with a nested string matcher");
tw(() => ({ className: "<- this key will get linted with a nested objectKeys matcher" }));
tw(() => ({ className: "this will get linted with nested objectValues matcher" }));
```

<br/>

##### Path option details

The `path` option lets you narrow down `objectKeys` and `objectValues` matching to specific object paths.  
  
This is especially useful for libraries like [Class Variance Authority (cva)](https://cva.style/docs/getting-started/installation#intellisense), where class names appear in nested object structures.  
  
`path` is a regex matched against the object path.  
  
For example, the following matcher will only match object values for the `compoundVariants.class` key:

<br/>

```json
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^cva$",
      "match": [
        {
          "type": "objectValues",
          "path": "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
        }
      ]
    }
  ]
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
  
For example, the object path for `value` in the object below is `root["nested-key"].values[0].value`:

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

#### Example: lint only the first argument of the last curried call

```jsonc
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^tw$",
      "targetCall": "last",
      "targetArgument": "first"
    }
  ]
}
```

```tsx
tw("keep", "ignore")("this will get linted", "this will not");
```

#### Example: lint `cva` strings + specific nested values

```jsonc
{
  "selectors": [
    {
      "kind": "callee",
      "name": "^cva$",
      "match": [
        {
          "type": "strings"
        },
        {
          "type": "objectValues",
          "path": "^compoundVariants\\[\\d+\\]\\.(?:className|class)$"
        }
      ]
    }
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

#### Full example: custom Algolia attribute selector

You can match custom attributes by extending your `selectors` configuration. Here is an example on how to match the values inside the Algolia `classNames` objects:

```tsx
<SearchBox
  classNames={{
    form: "relative",
    root: "p-3 shadow-sm"
  }}
/>;
```

<br/>

```js
// eslint.config.js
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { SelectorKind } from "eslint-plugin-better-tailwindcss/types";
import { defineConfig } from "eslint/config";

export default defineConfig({
  plugins: {
    "better-tailwindcss": eslintPluginBetterTailwindcss
  },
  settings: {
    "better-tailwindcss": {
      entryPoint: "app/globals.css",
      selectors: {
        extend: [ // preserve default selectors
          {
            kind: SelectorKind.Attribute,
            match: [{ type: "objectValues" }],
            name: "^classNames$"
          }
        ]
      }
    }
  }
});
// ...
```
