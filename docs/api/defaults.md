
# Defaults

The plugin comes with a set of default [matchers](../configuration/advanced.md#matchers) for `attributes`, `callees`, `variables` and `tags`. These matchers are used to [determine how the rules should behave](../configuration/advanced.md#advanced-configuration) when checking your code.
In order to extend the default configuration instead of overwriting it, you can import the default options from `eslint-plugin-better-tailwindcss/api/defaults` and merge them with your own options.

<br/>
<br/>

## Extending the config

```ts
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import {
  getDefaultAttributes,
  getDefaultCallees,
  getDefaultTags,
  getDefaultVariables
} from "eslint-plugin-better-tailwindcss/api/defaults";
import { MatcherType } from "eslint-plugin-better-tailwindcss/api/types";


export default [
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      "better-tailwindcss/multiline": ["warn", {
        callees: [
          ...getDefaultCallees(),
          [
            "myFunction", [
              {
                match: MatcherType.String
              }
            ]
          ]
        ]
      }],
      "better-tailwindcss/no-duplicate-classes": ["warn", {
        attributes: [
          ...getDefaultAttributes(),
          [
            "myAttribute", [
              {
                match: MatcherType.String
              }
            ]
          ]
        ]
      }],
      "better-tailwindcss/no-unnecessary-whitespace": ["warn", {
        variables: [
          ...getDefaultVariables(),
          [
            "myVariable", [
              {
                match: MatcherType.String
              }
            ]
          ]
        ]
      }],
      "better-tailwindcss/sort-classes": ["warn", {
        attributes: [
          ...getDefaultTags(),
          [
            "myTag", [
              {
                match: MatcherType.String
              }
            ]
          ]
        ]
      }]
    }
  }
];
```
