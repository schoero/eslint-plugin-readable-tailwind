# Name

This is the simplest form to define string literals to lint. Callees, variables or class attributes with that name will be linted.

## Type

```ts
type Name = string;
```

## Examples

```json
{
  "callees": ["myFunction"],
  "variables": ["myVariable"],
  "classAttributes": ["myAttribute"]
}
```

These patterns would lint the following examples:

```tsx
const myVariable = "this will get linted";
```

```tsx
const test = myFunction("this will get linted");
```

```tsx
<img myAttribute="this will get linted" />;
```

## Limitations

When matching literals by their name, only the immediate literals will get linted and nested literals will be ignored.
