<div align="center">
  <img alt="eslint-plugin-readable-tailwind logo" src="https://raw.githubusercontent.com/schoero/eslint-plugin-readable-tailwind/main/assets/eslint-plugin-readable-tailwind-logo.svg">
</div>

---

<div align="center">

  [![GitHub license](https://img.shields.io/github/license/schoero/eslint-plugin-readable-tailwind?style=flat-square&labelColor=454c5c&color=00AD51)](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/LICENSE)
  [![npm version](https://img.shields.io/npm/v/eslint-plugin-readable-tailwind?style=flat-square&labelColor=454c5c&color=00AD51)](https://www.npmjs.com/package/eslint-plugin-readable-tailwind?activeTab=versions)
  [![GitHub issues](https://img.shields.io/github/issues/schoero/eslint-plugin-readable-tailwind?style=flat-square&labelColor=454c5c&color=00AD51)](https://github.com/schoero/eslint-plugin-readable-tailwind/issues)
  [![npm weekly downloads](https://img.shields.io/npm/dw/eslint-plugin-readable-tailwind?style=flat-square&labelColor=454c5c&color=00AD51)](https://www.npmjs.com/package/eslint-plugin-readable-tailwind?activeTab=readme)
  [![GitHub repo stars](https://img.shields.io/github/stars/schoero/eslint-plugin-readable-tailwind?style=flat-square&labelColor=454c5c&color=00AD51)](https://github.com/schoero/eslint-plugin-readable-tailwind/stargazers)
  [![GitHub workflow status](https://img.shields.io/github/actions/workflow/status/schoero/eslint-plugin-readable-tailwind/ci.yml?event=push&style=flat-square&labelColor=454c5c&color=00AD51)](https://github.com/schoero/eslint-plugin-readable-tailwind/actions?query=workflow%3ACI)

</div>

---

<br/>
<br/>

ESLint plugin to automatically break up long tailwind class strings into multiple lines for better readability.
Also sorts the classes logically, removes unnecessary whitespaces and groups the classes by their modifiers.

<br/>
<br/>

<div align="center">
  <img alt="eslint-plugin-readable-tailwind example" width="640px" src="https://raw.githubusercontent.com/schoero/eslint-plugin-readable-tailwind/main/assets/eslint-plugin-readable-tailwind-example.png">
</div>

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-readable-tailwind`:

```sh
npm install eslint-plugin-readable-tailwind --save-dev
```

## Usage

Add `readable-tailwind` to your flat eslint config:

```js
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";

export default [
  {
    plugins: {
      "readable-tailwind": eslintPluginReadableTailwind
    },
    rules: {
      ...eslintPluginReadableTailwind.configs["recommended/warn"]
    }
  }
];
```

## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                 | Description                                            | 🔧 |
| :------------------------------------------------------------------- | :----------------------------------------------------- | :- |
| [jsx-attribute-expression](docs/rules/jsx-attribute-expression.md)   | Enforce consistent jsx attribute expressions.          | 🔧 |
| [multiline](docs/rules/multiline.md)                                 | Enforce consistent line wrapping for tailwind classes. | 🔧 |
| [no-unnecessary-whitespace](docs/rules/no-unnecessary-whitespace.md) | Disallow unnecessary whitespace in tailwind classes.   | 🔧 |
| [sort-classes](docs/rules/sort-classes.md)                           | Enforce a consistent order for tailwind classes.       | 🔧 |

<!-- end auto-generated rules list -->
