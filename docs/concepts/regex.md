# Regular expressions

It is possible to provide regular expressions that match specific string literals you want to get linted.  

Regular expressions are defined as a tuple of a matching pattern for the whole container and a matching pattern for the string literals inside that container. Multiple capturing groups can be used to match multiple string literals.  

This is inspired by [Class Variance Authority](https://cva.style/docs/getting-started/installation#intellisense).

## Type

```ts
type Regex = [
  containerRegex: string,
  literalRegex: string
][];
```

## Examples

```jsonc
{
  "classAttributes": [
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

## Limitations

While regular expressions are a simple way to match specific nested string literals, they are not as powerful as matchers. Matchers allow for more fine-grained control and are able to filter based on the abstract syntax tree.

Learn more about matchers [here](/docs/concepts/matchers).
