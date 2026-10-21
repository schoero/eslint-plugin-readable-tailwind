
# Defaults

The plugin comes with a set of default [selectors](../configuration/advanced.md#selectors). These selectors are used to [determine how the rules should behave](../configuration/advanced.md#advanced-configuration) when checking your code.
In order to extend the default configuration instead of overwriting it, you can import the default options from `eslint-plugin-better-tailwindcss/defaults` and merge them with your own options.
To only add selectors, use [`selectors: { extend: [...] }`](../settings/settings.md#selectors) instead; importing the defaults is mainly useful to filter or reorder them.

<br/>
<br/>

## Extending the config

```ts
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/defaults";
import { MatcherType, SelectorKind } from "eslint-plugin-better-tailwindcss/types";


export default [
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      "better-tailwindcss/enforce-consistent-class-order": ["warn", {
        selectors: [
          ...getDefaultSelectors(),
          // custom tag
          {
            kind: SelectorKind.Tag,
            match: [
              {
                type: MatcherType.String
              }
            ],
            name: "^myTag$"
          },
          // custom callee
          {
            kind: SelectorKind.Callee,
            match: [
              {
                type: MatcherType.String
              }
            ],
            name: "^myFunction$"
          },
          // custom attribute
          {
            kind: SelectorKind.Attribute,
            match: [
              {
                type: MatcherType.String
              }
            ],
            name: "^myAttribute$"
          },
          // custom variable
          {
            kind: SelectorKind.Variable,
            match: [
              {
                type: MatcherType.String
              }
            ],
            name: "^myVariable$"
          }
        ]
      }]
    }
  }
];
```
