
# Defaults

Every [rule](../../README.md#rules) can target multiple class attributes, callee names, variable names or template literal tags.

Read the [concepts documentation](../concepts/concepts.md) first to learn why this is important and what different options there are to define where to look for tailwind classes.

The default configuration is designed to work with the most popular tailwind utilities:

- [tailwind merge](https://github.com/dcastil/tailwind-merge)
- [class variance authority](https://github.com/joe-bell/cva)
- [tailwind variants](https://github.com/nextui-org/tailwind-variants?tab=readme-ov-file)
- [shadcn](https://ui.shadcn.com/docs/installation/manual)
- [classcat](https://github.com/jorgebucaran/classcat)
- [class list builder](https://github.com/crswll/clb)
- [clsx](https://github.com/lukeed/clsx)
- [cnbuilder](https://github.com/xobotyi/cnbuilder)
- [classnames template literals](https://github.com/netlify/classnames-template-literals)
- [obj str](https://github.com/lukeed/obj-str)

<br/>
<br/>

If an utility is not supported or you have built your own, you can change the matchers in the configuration. If you want to extend the default config, you can import it from the plugin:

<br/>
<br/>

```ts
import {
  getDefaultCallees,
  getDefaultClassAttributes,
  getDefaultTags,
  getDefaultVariables
} from "eslint-plugin-readable-tailwind/api/defaults";
```

<br/>
<br/>

## Extending the config

```ts
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";
import {
  getDefaultCallees,
  getDefaultClassAttributes,
  getDefaultVariables
} from "eslint-plugin-readable-tailwind/api/defaults";
import { MatcherType } from "eslint-plugin-readable-tailwind/api/types";


export default [
  {
    plugins: {
      "readable-tailwind": eslintPluginReadableTailwind
    },
    rules: {
      "readable-tailwind/multiline": ["warn", {
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
      "readable-tailwind/no-duplicate-classes": ["warn", {
        classAttributes: [
          ...getDefaultClassAttributes(),
          [
            "myAttribute", [
              {
                match: MatcherType.String
              }
            ]
          ]
        ]
      }],
      "readable-tailwind/no-unnecessary-whitespace": ["warn", {
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
      "readable-tailwind/sort-classes": ["warn", {
        classAttributes: [
          ...getDefaultTags(),
          [
            "tw", [
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
