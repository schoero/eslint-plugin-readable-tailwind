<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/eslint-plugin-readable-tailwind-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./eslint-plugin-readable-tailwind-logo-light.svg">
    <img alt="eslint-plugin-readable-tailwind logo" src="./eslint-plugin-readable-tailwind-logo.svg">
  </picture>
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

<br/>
<br/>

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-readable-tailwind`:

```sh
npm install eslint-plugin-readable-tailwind --save-dev
```

<br/>

## Usage

### Flat config

Add `readable-tailwind` to your [flat eslint config](https://eslint.org/docs/latest/use/configure/configuration-files-new):

```js
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";

export default [
  {
    plugins: {
      "readable-tailwind": eslintPluginReadableTailwind
    },
    rules: {
      // enable all recommended rules
      ...eslintPluginReadableTailwind.configs["recommended-warn"],
      // or enable rules individually
      "readable-tailwind/jsx-attribute-expression": "warn"
    }
  }
];
```

<br/>

#### VSCode

To enable the new flat config format in VSCode, add the following to your `.vscode/settings.json`:

```jsonc
{
  "eslint.experimental.useFlatConfig": true
}
```

<br/>

### Legacy config

Add `readable-tailwind` to your eslint config:

```jsonc
{
  // enable all recommended rules
  "extends": [
    // enable errors on violations
    "plugin:readable-tailwind/recommended-error",
    // or warn on violations
    "plugin:readable-tailwind/recommended-warn"
  ],
  "plugins": ["readable-tailwind"],
  "rules": {
    // or enable rules individually
    "readable-tailwind/jsx-attribute-expression": "warn"
  }
}
```

<br/>
<br/>

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                 | Description                                            | 💼                           | ⚠️                          | 🔧 |
| :------------------------------------------------------------------- | :----------------------------------------------------- | :--------------------------- | :-------------------------- | :- |
| [jsx-attribute-expression](docs/rules/jsx-attribute-expression.md)   | Enforce consistent jsx attribute expressions.          | ![badge-recommended-error][] | ![badge-recommended-warn][] | 🔧 |
| [multiline](docs/rules/multiline.md)                                 | Enforce consistent line wrapping for tailwind classes. | ![badge-recommended-error][] | ![badge-recommended-warn][] | 🔧 |
| [no-unnecessary-whitespace](docs/rules/no-unnecessary-whitespace.md) | Disallow unnecessary whitespace in tailwind classes.   | ![badge-recommended-error][] | ![badge-recommended-warn][] | 🔧 |
| [sort-classes](docs/rules/sort-classes.md)                           | Enforce a consistent order for tailwind classes.       | ![badge-recommended-error][] | ![badge-recommended-warn][] | 🔧 |

<!-- end auto-generated rules list -->
