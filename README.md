<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/eslint-plugin-readable-tailwind-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/eslint-plugin-readable-tailwind-logo-light.svg">
    <img alt="eslint-plugin-readable-tailwind logo" src="./assets/eslint-plugin-readable-tailwind-logo.svg">
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

ESLint plugin to automatically break up long tailwind class strings into multiple lines based on a specified print width or class count. This improves readability and eliminates horizontal scrolling.  
It also sorts the classes logically, removes unnecessary whitespaces and groups the classes by their modifiers. It works in jsx, svelte, vue, and html files and is designed to work well with and without prettier.

<br/>
<br/>

<div align="center">
  <img alt="eslint-plugin-readable-tailwind example" width="640px" src="./assets/eslint-plugin-readable-tailwind-demo.webp">
</div>

<br/>
<br/>

<div align="center">

  <a href="https://github.com/sponsors/schoero">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./assets/sponsor-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="./assets/sponsor-light.svg">
      <img alt="eslint-plugin-readable-tailwind logo" src="./assets/sponsor-dark.svg">
    </picture>
  </a>
  
  This project is financed by the community.  
  If you or your company benefit from this project, please consider becoming a sponsor.  
  Your contribution will help me maintain and develop the project.

</div>

<br/>
<br/>

## Installation

```sh
npm i -D eslint-plugin-readable-tailwind
```

<br/>

## Usage

Please read the documentation for the specific flavor you are using:

- [JSX/TSX](docs/parsers/jsx.md) (React, Qwik, Solid, etc.)
- [Svelte](docs/parsers/svelte.md)
- [Vue](docs/parsers/vue.md)
- [HTML](docs/parsers/html.md)

<br/>
<br/>

## Rules

| Name | Description | `error` | `warning` | autofix |
| :--- | :--- | :---: | :---: | :---: |
| [multiline](docs/rules/multiline.md) | Enforce consistent line wrapping for tailwind classes. | ✔ | ✔ | ✔ |
| [no-unnecessary-whitespace](docs/rules/no-unnecessary-whitespace.md) | Disallow unnecessary whitespace in tailwind classes. | ✔ | ✔ | ✔ |
| [sort-classes](docs/rules/sort-classes.md) | Enforce a consistent order for tailwind classes. | ✔ | ✔ | ✔ |

<br/>
<br/>

## Editor configuration

### VSCode

#### Auto-fix on save

These rules are intended to automatically fix the tailwind classes. If you have installed the [VSCode ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), you can configure it to automatically fix the classes on save by adding the following options to your `.vscode/settings.json`:

```jsonc
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

<br/>
<br/>

## 🩷 Sponsored by the following awesome people and organizations

*No awesome people or organizations have sponsored this project yet.*
