# Matchers

Matchers are a new way to match string literals. They allow finer control than regular expressions as they operate directly on the abstract syntax tree.
This allows additional filtering, such as literals in conditions or logical expressions. This opens up the possibility to lint any string that may contain tailwindcss classes while also reducing the number of false positives.

Matchers are defined as a tuple of a name and a list of configurations for predefined matchers.  

<br/>

## Type

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

#### Path pattern

It is possible to provide a `pathPattern` to the `objectKeys` and `objectValues` matchers to only match keys/values that match the `pathPattern`. This allows for more fine-grained control for common utilities like [Class Variance Authority](https://cva.style/docs/getting-started/installation#intellisense).

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

<br/>

The object path is a string that represents the path to the object key or value. The path is constructed by concatenating the keys of the object with a dot (`.`) in between. For example, the object `{ a: { b: "value" } }` would have the path `a.b`. Array indices are represented by square brackets (`[]`). For example, the object `{ a: [{ b: "value" }] }` would have the path `a[0].b`.

<br/>

## Examples

```jsonc
{
  "classAttributes": [
    [
      // matches attributes with the name `myAttribute`
      "myAttribute",
      // matches the object value for the `myProperty` key
      [
        {
          "match": "objectValues",
          "pathPattern": "^myProperty|\\.myProperty"
        }
      ] 
    ]
  ]
}
```

```tsx
<img myAttribute={{ myProperty: "this will get linted" }} />;
```

<br/>

```jsonc
{
  "callees": [
    [
      // matches callees with the name `myFunction`
      "myFunction",
      // matches the object value for the `myProperty` key
      [
        {
          "match": "objectValues",
          "pathPattern": "^myProperty|\\.myProperty"
        }
      ] 
    ]
  ]
}
```

```tsx
const myVariable = {
  myProperty: "this will get linted"
};
```

<br/>

```jsonc
{
  "variables": [
    [
      // matches variables with the name `myVariable`
      "myVariable",
      // matches the object value for the `myProperty` key
      [
        {
          "match": "objectValues",
          "pathPattern": "^myProperty|\\.myProperty"
        }
      ] 
    ]
  ]
}
```

```tsx
const test = myFunction({ myProperty: "this will get linted" });
```
