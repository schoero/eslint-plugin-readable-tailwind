# better-tailwindcss/no-concatenated-classes

Disallow concatenated Tailwind CSS classes in class strings.

Concatenated or interpolated class names can be missed by Tailwind's class detection and may be purged from the final CSS output.
See the [Tailwind documentation](https://tailwindcss.com/docs/detecting-classes-in-source-files).

<br/>

## Examples

```text
// ❌ BAD: class name built dynamically via concatenation
<div className={"bg-" + color} />;
```

```tsx
// ❌ BAD: class name built dynamically via interpolation
<div className={`bg-${color}`} />;
```

```tsx
// ✅ GOOD: class name is fully static and detectable
<div className="bg-red-500 text-white" />;
```
