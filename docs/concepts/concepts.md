# Concepts

The [rules](../../README.md#rules) of this plugin can't apply to every string literal in your code. They need to know where to look for tailwind classes, otherwise all your string literals would get formatted, which definitely would break your code.

There are different ways to define where to look for tailwind classes.

- [Name](#name): Matches a single string literal by the name of the callee, variable or attribute.
- [Regular expressions](#regular-expressions): Matches multiple string literals by regular expressions.
- [Matchers](#matchers): Matches multiple string literals by the abstract syntax tree.

<br/>

By default, the plugin is configured with various [matchers](#matchers) to work with [most popular tailwind utilities](../api/defaults.md).  
It is possible that you never have to change this configuration, but if you do need to override or extend the default configuration, you can read the [API documentation](../api/defaults.md).

<br/>
<br/>

## Name

The simplest form to define string literals to lint is by their name. Callees, variables or attributes with that name will be linted.

The name is treated as a regular expression, so the following conditions should be met:

- Reserved characters in regular expressions should be escaped.
- The regular expression must match the whole name. Partial matches will be ignored.

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

### Limitations

When matching literals by their name, only the immediate literals will get linted and nested literals will be ignored.  
Use [regular expressions](#regular-expressions) or [matchers](#matchers) to lint nested literals.

<br/>
<br/>

## Regular expressions

It is possible to provide regular expressions that match specific string literals you want to get linted.  

Regular expressions are defined as a tuple of a matching pattern for the whole container and a matching pattern for the string literals inside that container. Multiple capturing groups can be used to match multiple string literals.  

This is inspired by [Class Variance Authority](https://cva.style/docs/getting-started/installation#intellisense).

<br/>

### Type

```ts
type Regex = [
  containerRegex: string,
  literalRegex: string
][];
```

<br/>

### Examples

```jsonc
{
  "attributes": [
    [
      // matches the attribute name and the attribute value
      "myAttribute={([\\S\\s]*)}",
      // matches the object value for the `myProperty` key
      "\"myProperty\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
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
      // matches all arguments inside the parentheses of the cva function call
      "myFunction\\(([^)]*)\\)",
      // matches the object value for the `myProperty` key
      "\"myProperty\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
    ]
  ]
}
```

```tsx
const test = myFunction({ myProperty: "this will get linted" });
```

<br/>

```jsonc
{
  "variables": [
    [
      // matches the variable name and the right side of the assignment
      "myVariable = ([\\S\\s]*)",
      // matches the object value for the `myProperty` key
      "\"myProperty\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
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

### Limitations

While regular expressions are a simple way to match specific nested string literals, they are not as powerful as [matchers](#matchers). Matchers allow for more fine-grained control and are able to filter based on the abstract syntax tree.

<br/>
<br/>

## Matchers

Matchers are the most powerful way to match string literals. They allow finer control than regular expressions as they operate directly on the abstract syntax tree.
This allows additional filtering, such as literals in conditions or logical expressions. This opens up the possibility to lint any string that may contain tailwindcss classes while also reducing the number of false positives.

Matchers are defined as a tuple of a name and a list of configurations for predefined matchers.  
The name is treated as a regular expression, so the following conditions should be met:

- Reserved characters in regular expressions should be escaped.
- The regular expression must match the whole name. Partial matches will be ignored.

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

#### Path pattern

It is possible to provide a `pathPattern` to the `objectKeys` and `objectValues` matchers, to only match keys/values that match the `pathPattern`. This allows for more fine-grained control for common utilities like [Class Variance Authority](https://cva.style/docs/getting-started/installation#intellisense).  
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

The object path is a string that represents the path to the object key or value. The path is constructed by concatenating the keys of the object with a dot (`.`) in between. Array indices are represented by square brackets (`[]`). If a name contains special characters, square brackets with double quotes are used to escape them.

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
  "attributes": [
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
