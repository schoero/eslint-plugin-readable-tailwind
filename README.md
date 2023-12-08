# eslint-plugin-readable-tailwind

auto-wraps tailwind classes after a certain width using template literals.

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

Add `tailwind-multiline` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "tailwind-multiline"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "tailwind-multiline/rule-name": 2
    }
}
```

## Rules

<!-- begin auto-generated rules list -->
TODO: Run eslint-doc-generator to generate the rules list.
<!-- end auto-generated rules list -->


