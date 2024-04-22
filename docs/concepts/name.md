# Name

This is the simplest form to define string literals to lint. Callees, variables or class attributes with that name will be linted.

<br/>

## Type

```ts
type Name = string;
```

<br/>

## Examples

```jsonc
{
  "classAttributes": ["myAttribute"]
}
```

```tsx
<img myAttribute="this will get linted" />;
```

<br/>

```jsonc
{
  "callees": ["myFunction"]
}
```

```tsx
const test = myFunction("this will get linted");
```

<br/>

```jsonc
{
  "variables": ["myVariable"]
}
```

```tsx
const myVariable = "this will get linted";
```

<br/>

## Limitations

When matching literals by their name, only the immediate literals will get linted and nested literals will be ignored.  
Use [Regex](./regex.md) or [Matchers](./matchers.md) to lint nested literals.
