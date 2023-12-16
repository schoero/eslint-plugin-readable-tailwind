# readable-tailwind/jsx-attribute-expression

💼⚠️ This rule is enabled in the ❗ `error` config. This rule _warns_ in the 🚸 `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Description

Enforce the use of normal quotes in JSX attributes if the value is a string literal.

## Examples

```tsx
// ❌ BAD
const Test = () => <div className={"text-black"} />;
```

```tsx
// ✅ GOOD
const Test = () => <div className="text-black" />;
```

## Options

<!-- begin auto-generated rule options list -->

| Name         | Description                                                       | Type   | Choices               | Default     |
| :----------- | :---------------------------------------------------------------- | :----- | :-------------------- | :---------- |
| `expression` | List of function names whose arguments should also be considered. | String | `always`, `as-needed` | `as-needed` |

<!-- end auto-generated rule options list -->
