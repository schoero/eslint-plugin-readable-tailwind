# Changelog

## v3.1.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.0.0...v3.1.0)

### Features

- Add support for astro syntactic sugar ([#103](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/103))
- New rule `enforce consistent variable syntax` ([#101](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/101))

### Fixes

- Remove `name` property ([#105](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/105))

## v3.0.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v2.1.2...v3.0.0)

This version adds 3 new correctness rules to the plugin. To better reflect the new scope of the plugin it was renamed from `eslint-plugin-readable-tailwind` to `eslint-plugin-better-tailwindcss`. <https://github.com/schoero/eslint-plugin-readable-tailwind/issues/86#issuecomment-2855845766>

The predefined configs also have been renamed to better reflect their scope.

### Features

- [no-unregistered-classes](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-unregistered-classes.md): Report classes not registered with tailwindcss. ([#89](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/89))
- [no-conflicting-classes](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-conflicting-classes.md): Report classes that produce conflicting styles. ([#90](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/90))
- [no-restricted-classes](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-restricted-classes.md): Disallow restricted classes. ([#92](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/92))

#### ⚠️ Breaking changes

- Plugin renamed to `eslint-plugin-better-tailwindcss`
- Deprecate [Regex matchers](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/v2.1.2/docs/concepts/concepts.md#regular-expressions) to simplify the configuration. ([#98](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/98))  
  [Regex matchers](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/v2.1.2/docs/concepts/concepts.md#regular-expressions) were an early attempt to make the plugin more flexible. However, they were quickly replaced with [Matchers](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/v2.1.2/docs/concepts/concepts.md#matchers) which work on the Abstract Syntax Tree and are far more powerful. Support for [Regex matchers](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/v2.1.2/docs/concepts/concepts.md#regular-expressions) will be removed in the next major version.  

- `warning` and `error` configs have been removed. Use `recommended-warn` or `recommended-error` instead. ([#99](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/99))

### Migration

1. Replace `eslint-plugin-readable-tailwind` with `eslint-plugin-better-tailwindcss`:

  ```sh
  npm uninstall eslint-plugin-readable-tailwind
  ```

  ```sh
  npm i -D eslint-plugin-better-tailwindcss
  ```

1. Update the imports in your config:

  ```diff
  - import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind"; 
  + import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
  ```

1. Migrate to the new configs

  ```diff
  rules: {
       // enable all recommended rules to warn
  -    ...eslintPluginReadableTailwind.configs.warning.rules,
  +   ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
       // enable all recommended rules to error
  -    ...eslintPluginReadableTailwind.configs.error.rules,
  +    ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,

      // or configure rules individually
  -    "readable-tailwind/multiline": ["warn", { printWidth: 100 }]
  +    "better-tailwindcss/multiline": ["warn", { printWidth: 100 }] 
    }
  ```

## v2.1.2

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v2.1.1...v2.1.2)

### Fixes

- Multiline quotes ([#96](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/96))

### Refactors

- Report error for each duplicate class instead of the whole class string ([#91](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/91))

## v2.1.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v2.1.0...v2.1.1)

### Fixes

- Unnecessarily escaped quotes in autofixed classes ([#88](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/88))

## v2.1.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v2.0.1...v2.1.0)

### Features

- Experimental angular support. ([#85](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/85))

### Fixes

- Keep carriage return in es literals when used with vue parser ([#84](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/84))

## v2.0.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v2.0.0...v2.0.1)

### Fixes

- Keep original newline characters ([a564783](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/a564783))

### Refactors

- Display warning if plugin is misconfigured ([7c532cd](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/7c532cd))

### Documentation

- Update quick start guide ([e570981](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/e570981))

## v2.0.0

Adds tailwindcss v4 support while keeping support for tailwindcss v3. ([#78](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/78))

This version contains breaking changes. Most notably support for Node.js < 20 had to be dropped. The other breaking changes are mostly just changes of the default config, that may cause linting errors.

### Migration

- If you use tailwindcss v4, you should specify the [`entryPoint`](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/sort-classes.md#entrypoint) of the css based tailwind configuration file for the [sort-classes](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/sort-classes.md) rule or in the [settings](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/settings/settings.md#entrypoint).
- If you have customized the `classAttributes` option for any of the rules or via the [settings](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/settings/settings.md#attributes), rename the option to [`attributes`](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/settings/settings.md#attributes)
- If you have customized `attributes`,  `callees`, `variables`,  or `tags`, escape any reserved characters for regular expressions in the name as the name is now evaluated as a regular expression.

  For example:

  ```diff
   {
     variables: [
  -    "$MyVariable"
  +    "\\$MyVariable"
     ]
   }
  ```

### Changes

- Reload tailwind config automatically if a change is detected.
- Options now correctly override settings ([#66](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/66))

#### ⚠️ Breaking Changes

- ⚠️  Drop support for Node.js < 20 due to incompatibility of worker threads.
- ⚠️  Add support for tailwindcss v4 ([#25](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/25))
  - The official class ordering seems to have changed slightly.
  - The `improved` sorting order will no longer sort variants alphabetically, instead it just makes sure that identical variants are grouped together.
  
- ⚠️  Regex names ([#63](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/63))
  - ["Names"](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/configuration/advanced.md#name-based-matching) can now be regular expressions. This is a breaking change, if you have names configured that contain reserved characters in regular expressions like `$`.
- ⚠️  Enable `no-duplicate-classes` by default ([#67](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/67))
- ⚠️  Change default  `multiline` grouping to `newLine` ([#68](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/68))
- ⚠️  Rename `classAttributes` to `attributes` ([#69](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/69))

## v1.9.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v2.0.0-beta.2...v1.9.1)

### Fixes

- Lint `className` in render functions inside object ([#75](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/75))

## v1.9.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.8.2...v1.9.0)

### Features

- Template literal tags ([#65](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/65))

## v1.8.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.8.1...v1.8.2)

### Fixes

- Fixing loop when lines wrap on two lines immediately but was theoretically short enough to not wrap ([#61](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/61))

## v1.8.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.8.0...v1.8.1)

### Refactors

- Improve display of linting errors ([#60](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/60))

## v1.8.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.7.0...v1.8.0)

### Features

- Add support to globally configure shared options across all rules via the settings object ([#56](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/56))

## v1.7.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.6.1...v1.7.0)

### Features

- New option `preferSingleLine` ([#54](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/54))

## v1.6.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.6.0...v1.6.1)

### Fixes

- Group type `never` not working with expressions ([#53](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/53))

## v1.6.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.5.3...v1.6.0)

### Features

- New rule `no-duplicate-classes` ([#49](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/49))  
  This rule will be enabled by default in v2.0.0. If you want to enable it now, please refer to the [rule documentation](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-duplicate-classes.md).  
  You can suggest additional rules in the [discussions](https://github.com/schoero/eslint-plugin-better-tailwindcss/discussions/categories/new-rules-or-options?discussions_q=category%3A%22New+rules+or+options%22+).  

### Refactors

- Revert back to vitest ([38f6eab](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/38f6eab))

## v1.5.3

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.5.2...v1.5.3)

### Refactors

- Insertion of unnecessary escape characters ([#47](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/47))

## v1.5.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.5.1...v1.5.2)

### Fixes

- Remove unnecessary plugin import in shared config ([#44](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/44))
- Support svelte shorthand syntax ([#43](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/43))

## v1.5.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.5.0...v1.5.1)

### Fixes

- Commonjs build ([#39](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/39))

## v1.5.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.4.0...v1.5.0)

### Features

- Vue bound classes ([#31](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/31))

### Fixes

- Change quotes in multiline arrays ([#32](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/32))
- Escape nested quotes ([#33](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/33))
- Allow call expressions as object values ([#34](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/34))
- Attributes are no longer case sensitive ([#35](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/35))
- Warn in html matchers ([#36](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/36))
- Don't treat escape characters as whitespace ([6aa74f8](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/6aa74f8))

### Refactors

- Simplify build system ([#26](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/26), [#29](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/29))

## v1.4.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.3.2...v1.4.0)

### Features

- Matchers ([#28](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/28))

## v1.3.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.3.1...v1.3.2)

### Fixes

- Remove unnecessary newline after single sticky class ([#23](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/23))
- Prevent inserting new line if the first class is already too long ([#24](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/24))

### Tests

- Simplify testing ([#22](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/22))

## v1.3.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.3.0...v1.3.1)

### Fixes

- Accept tabs ([#21](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/21))

## v1.3.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.2.5...v1.3.0)

### Features

- Add eslint 9 support ([#19](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/19))

### Chore

- Update dependencies ([be69b11](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/be69b11))

## v1.2.5

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.2.4...v1.2.5)

### Performance

- Cache tailwind config and context ([#16](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/16))

### Fixes

- Resolving tailwind config ([#15](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/15))

## v1.2.4

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.2.3...v1.2.4)

### Fixes

- Sticky expressions ([#13](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/13))

## v1.2.3

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.2.2...v1.2.3)

### Fixes

- Remove unnecessary trailing spaces in multiline strings ([#12](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/12))
- False positives when using `crlf` ([#11](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/11))

## v1.2.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.2.1...v1.2.2)

### Fixes

- False positives of unnecessary whitespace around template literal elements ([#9](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/9))

## v1.2.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.2.0...v1.2.1)

### Fixes

- Don't wrap empty attributes ([#8](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/8))

## v1.2.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.1.1...v1.2.0)

### Features

- Lint variables ([#7](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/7))

### Fixes

- Apply nested regex only to container groups ([#6](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/6))

## v1.1.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.1.0...v1.1.1)

### Fixes

- Invalid collapsing with template literal expressions ([adfafbf](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/adfafbf))

## v1.1.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v1.0.0...v1.1.0)

### Features

- Collapse unnecessary newlines ([#4](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/4))
- Regex as callees ([#3](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/3))
