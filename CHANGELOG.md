# Changelog

## v4.6.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.6.0...v4.6.1)

### Fixes

- Nested function calls ([#387](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/387))

## v4.6.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.5.0...v4.6.0)

### Features

- **enforce-logical-properties:** Add ignore option ([#383](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/383))

### Fixes

- **enforce-canonical-classes:** Self referencing autofixes ([#382](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/382))
- **enforce-consistent-class-order:** Strict sorting order ([#381](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/381))

## v4.5.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.4.1...v4.5.0)

### Features

- Add `ignore` option to `enforce-canonical-classes` ([#371](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/371))
- Add `tabWidth` option to `enforce-consistent-line-wrapping` ([#367](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/367))

### Fixes

- Add missing logical classes ([#368](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/368))
- Warning when tailwind css installation can't be found ([#373](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/373))
- Only sort variants that are safe ([#370](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/370))

## v4.4.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.4.0...v4.4.1)

### Fixes

- Remove auto detection of project root to set `cwd` ([#364](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/364))

  If you're in a monorepo setup, you may need to [configure the `cwd`](https://github.com/schoero/eslint-plugin-better-tailwindcss?tab=readme-ov-file#monorepo-setup) manually.

## v4.4.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.3.2...v4.4.0)

### Features

- Project root based cwd in monorepos ([#345](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/345))
- Target specific arguments of callees ([#347](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/347))
- New Anonymous functions matcher ([#348](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/348))
- Add support for tag paths ([#354](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/354))
- Reintroduce line ending and indentation misconfiguration warnings ([#351](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/351))
- **worker:** Use SYNCKIT_TIMEOUT env var for timeout configuration ([#352](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/352))
- Match default exports ([#346](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/346))
- React twc preset ([#355](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/355))
- Lint Template literal based on prefixed comments ([#356](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/356))
- New rule `enforce-logical-properties` ([#358](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/358))
- New rule `enforce-consistent-variant-order` ([#359](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/359))

### Performance

- Cache regex, early return ([#336](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/336))

### Documentation

- Add example to restrict unnamed groups ([#357](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/357))

### ❤️ Contributors

- Mickaël Depardon ([@squelix](https://github.com/squelix))
- Mike Schutte ([@tmikeschu](https://github.com/tmikeschu))
- Stephen Zhou ([@hyoban](https://github.com/hyoban))

## v4.3.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.3.1...v4.3.2)

### Fixes

- **no-unnecessary-whitespace:** Preserve whitespaces in concatenated strings ([#339](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/339))
- **enforce-consistent-class-order:** Non localized alphabetical sorting order ([#340](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/340))

### Refactors

- Lint concatenated strings ([#338](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/338))

## v4.3.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.3.0...v4.3.1)

### Fixes

- Variable matchers leaking into function expressions ([#333](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/333))

### Documentation

- Add oxlint documentation ([#331](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/331))

## v4.3.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.2.0...v4.3.0)

### Features

- Support curried calls ([#325](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/325))
- Support callee paths ([#326](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/326))

### Refactors

- Simplify matcher config ([#324](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/324))
  The matcher config has been simplified from a nested tuple structure to a simple array of objects. This makes it easier
  to understand while also allowing better flexibility to support the new features. The old structure is still supported
  for now, but will be removed in the next major version.

  Check the updated [configuration documentation](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/configuration/advanced.md#selectors) for more information.

## v4.2.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.1.1...v4.2.0)

### Features

- Add support for ESLint 10 ([#323](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/323))

### Performance

- Use shared worker to handle async calls ([#319](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/319))

### ❤️ Contributors

- Stephen Zhou ([@hyoban](https://github.com/hyoban))
- Bjorn Antonissen ([@Bjornftw](https://github.com/Bjornftw))

## v4.1.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.1.0...v4.1.1)

### Fixes

- Filter unrecommended rules ([#317](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/317))

## v4.1.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.0.2...v4.1.0)

### Features

- Experimental css linting ([#314](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/314))
- Add solid `classList` matcher ([#315](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/315))

### Fixes

- Type errors ([c3c9c40](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/c3c9c40))
- Prevent linting when no literals are found ([51333c6](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/51333c6))
- Add `exactOptionalPropertyTypes` to `tsconfig` ([#311](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/311))

### ❤️ Contributors

- Alexander Kachkaev ([@kachkaev](https://github.com/kachkaev))

## v4.0.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.0.1...v4.0.2)

### Fixes

- `enforce-canonical-classes`: removal of unrelated classes ([#309](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/309))
- `enforce-consistent-variable-syntax`: Support custom css functions ([#308](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/308))
- Config types ([#310](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/310))

## v4.0.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.0.0...v4.0.1)

### Fixes

- Disallow extra properties in rule options (valibot schemas) ([#295](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/295))
- Configuration warnings getting lost ([#297](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/297))

### ❤️ Contributors

- Andrew Kazakov ([@andreww2012](https://github.com/andreww2012))

## v4.0.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.8.0...v4.0.0)

This version includes a major rewrite of the internal architecture, improving performance and maintainability, resolving long-standing issues, and preparing the codebase for the future and for oxlint.

### New Features

- New rule: `enforce-canonical-classes` ([#232](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/232))
- New options for `enforce-consistent-class-order` to sort "component classes" and "unknown classes" ([#263](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/263))
  - `detectComponentClasses`: `boolean`
  - `componentClassOrder`: `"asc" | "desc" | "preserve"`
  - `componentClassPosition`: `"start" | "end"`
  - `unknownClassOrder`: `"asc" | "desc" | "preserve"`
  - `unknownClassPosition`: `"start" | "end"`
- Added  `strictness: "loose"` option to `enforce-consistent-line-wrapping` to improve interoperability with prettier ([#260](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/260))
- Better Performance
- Oxlint support

<br />

### ⚠️ Breaking Changes

First of all, the minimum required Node.js version is has changed to support v23.0.0, v22.12.0, v20.19.0 to support `require(esm)`

- This made it possible to remove the `CommonJS` build ([#264](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/264))

<br />

Some rules have been renamed to better reflect their intentions:

- Renamed rule `no-unregistered-classes` to `no-unknown-classes`
- Renamed rule `sort-classes` to `enforce-consistent-class-order`
- Renamed rule `multiline` to `enforce-consistent-line-wrapping`

The rule recommendations have been updated to enable new rules by default. Check the updated [rule recommendations](https://github.com/schoero/eslint-plugin-better-tailwindcss?tab=readme-ov-file#stylistic-rules) for more information.

<br />

For some rules, the options have been renamed or changed:

- Options for `better-tailwindcss/enforce-consistent-variable-syntax` have been renamed to `shorthand` and `variable`.
- The default for `enforce-consistent-important-position` is now always `recommended`.
- Renamed the `improved` sorting order for `enforce-consistent-class-order` to `strict` ([#245](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/245))
  - `improved` is no longer the default option as most people expect the order to match the official order from tailwind.
  - the `improved` order got renamed to `strict` to better describe its intentions.
  - the logic of the `strict` order has changed:
    - Classes that share the same base variants get grouped together.
    - Classes with less variants come before classes with more variants.
    - Classes with arbitrary variants come last.
- The `enforce-consistent-line-wrapping` rule now groups variants more strictly. Previously it only grouped classes by their first variant. Now all variants are ordered correctly.

<br />

The configs have been renamed and updated to match the recommended shape of ESLint.

- Renamed configs ([#244](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/244))
  - The following configs are now exposed:
    - `recommended`
    - `recommended-warn`
    - `recommended-error`
    - `stylistic`
    - `stylistic-warn`
    - `stylistic-error`
    - `correctness`
    - `correctness-warn`
    - `correctness-error`
    - `legacy-recommended`
    - `legacy-recommended-warn`
    - `legacy-recommended-error`
    - `legacy-stylistic`
    - `legacy-stylistic-warn`
    - `legacy-stylistic-error`
    - `legacy-correctness`
    - `legacy-correctness-warn`
    - `legacy-correctness-error`
  - Please check the updated [Parser Documentation](https://github.com/schoero/eslint-plugin-better-tailwindcss?tab=readme-ov-file#quick-start) to see the recommended way to set up the plugin with your parser.

<br />

Other changes:

- Function `getDefaultIgnoredUnregisteredClasses()` has been removed.
- Removed rule regex matchers
- Preserve normal quotes whenever possible ([#246](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/246))

Here is the full list of changes in this version:

### Features

- New rule: `enforce-canonical-classes` ([#232](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/232))
- Oxlint support ([#284](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/284)
- Add `strictness: "loose"` option to `enforce-consistent-line-wrapping` ([#260](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/260))
- Add settings option to configure `messageStyle` ([#276](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/276))
- **angular:** Support bound attribute classes ([#277](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/277))
- **svelte:** Support class directive ([#278](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/278))

### Fixes

- Don't match attribute values for bound attribute names ([#291](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/291))
- Correctly override shared settings with rule options ([#289](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/289))
- Invalid variant grouping order ([#282](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/282))
- Ignore variants in custom component classes ([#258](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/258))
- Angular line wrapping ([#259](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/259))

### Refactors

- Deprecate `/api/` path for imports ([#281](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/281))
- Update rule recommendations ([#280](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/280))

### Documentation

- Add `detectComponentClasses` to settings ([388103e](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/388103e))
- Add attribute matcher example ([#272](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/272))
- Improve configuration guide ([bd873ea](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/bd873ea))

#### ⚠️ Breaking Changes

- ⚠️  Ignore indexed access keys ([#292](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/292))
- ⚠️  Update rule recommendations ([#280](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/280))
- ⚠️  Remove separate `CommonJS` build ([#264](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/264))
      Minimum Node.js version to v23.0.0, v22.12.0, v20.19.0 to support `require(esm)`
- ⚠️  Preserve normal quotes whenever possible ([#246](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/246))
- ⚠️  Renamed the `improved` sorting order to `strict` ([#245](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/245))
- ⚠️  Rename configs ([#244](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/244))
- ⚠️  Renamed rule `no-unregistered-classes` to `no-unknown-classes`
- ⚠️  Renamed rule `sort-classes` to `enforce-consistent-class-order`
- ⚠️  Renamed rule `multiline` to `enforce-consistent-line-wrapping`
- ⚠️  Options for `better-tailwindcss/enforce-consistent-variable-syntax` have been renamed to `shorthand` and `variable`.
- ⚠️  Function `getDefaultIgnoredUnregisteredClasses()` has been removed.
- ⚠️  The default for `enforce-consistent-important-position` is now always `recommended`. If you are on tailwindcss v3 need to manually set it to `legacy` to keep it working for tailwindcss v3.
- ⚠️  Removed rule regex matchers

### ❤️ Contributors

- V-iktor ([@V-iktor](https://github.com/V-iktor))

## v3.8.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.11...v3.8.0)

### Features

- **no-unregistered-classes:** Support `@import layer(components)` ([#257](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/257))

### Fixes

- Wrong documentation url ([#255](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/255))
- Ignore variants in custom component classes ([#258](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/258))
- Angular line wrapping ([#259](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/259))

### ❤️ Contributors

- Carlos Marques <karkosyk@gmail.com>

## v3.7.11

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v4.0.0-beta.3...v3.7.11)

### Fixes

- Convert missing flex shrink and grow utilities ([#236](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/236))
- Ignore literals in binary expressions ([#238](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/238))
- Allow interpolations in normal svelte string literals ([#239](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/239))
- Only show config warning when config is set and not found ([#240](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/240))

### ❤️ Contributors

- Akameco ([@akameco](https://github.com/akameco))

## v3.7.10

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.9...v3.7.10)

### Fixes

- `enforce-shorthand-classes` to include horizontal and vertical cases for `rounded` classes ([#231](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/231))

### Chore

- Correct recommended rules to match implementation ([#229](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/229))

### ❤️ Contributors

- Andrew Kodkod ([@akodkod](https://github.com/akodkod))
- 2754 ([@2754github](https://github.com/2754github))

## v3.7.9

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.8...v3.7.9)

### Fixes

- Don't match index accessed object keys ([#227](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/227))

## v3.7.8

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.7...v3.7.8)

### Fixes

- Improved angular support ([#182](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/182))
  - Fixes object key detection for intersecting classes
  - Adds support for `pathPattern` in angular

## v3.7.7

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.6...v3.7.7)

### Fixes

- Compound variants with slots class string not being detected ([#219](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/219))

### ❤️ Contributors

- tim-spitzer-syzygy ([@tim-spitzer-syzygy](https://github.com/tim-spitzer-syzygy))

## v3.7.6

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.5...v3.7.6)

### Fixes

- Check for tailwindcss before running rules ([#217](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/217))
- Angular: Prevent crash when objectContent is undefined in createLiteralByLiteralMapKey ([#215](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/215))

### Tests

- Add no-unregistered-classes test for DaisyUI classes ([#186](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/186))

### ❤️ Contributors

- Paul Parker ([@pauldesmondparker](https://github.com/pauldesmondparker))
- Yossi Yedid ([@yossiyedid](https://github.com/yossiyedid))

## v3.7.5

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.4...v3.7.5)

### Fixes

- Matching object values with immediate indexed access ([#212](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/212))

## v3.7.4

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.3...v3.7.4)

### Fixes

- Error in no-conflicting-classes when used in tailwindcss 3 ([#205](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/205))
- Invalid config warning when config was actually found ([#206](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/206))
- Differentiate shorthands for the same classes with different variants ([#207](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/207))

## v3.7.3

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.2...v3.7.3)

### Fixes

- Invalid fix for multiple vars in `enforce-consistent-variable-syntax` ([#200](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/200))

## v3.7.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.1...v3.7.2)

### Fixes

- Error when no tsconfig is available ([#195](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/195))

### Refactors

- Refine cache ([#196](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/196))

## v3.7.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.7.0...v3.7.1)

### Fixes

- `no-unnecessary-whitespace` false positive on empty string ([#191](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/191))
- Don't convert variable definitions ([#192](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/192))

### Chore

- Update dependencies ([#193](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/193))

## v3.7.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.6.3...v3.7.0)

### Features

- Support tsconfig paths ([#185](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/185))

### Refactors

- Exact unnecessary whitespace fixes ([#184](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/184))

## v3.6.3

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.6.2...v3.6.3)

### Fixes

- Error position ([7b699ee](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/7b699ee))

### Refactors

- Add missing deprecations ([#181](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/181))
- Variable syntax tailwindcss3 shorthand ([#183](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/183))

## v3.6.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.6.1...v3.6.2)

### Fixes

- Fixes crash when importing css files via tsconfig path alias and [`detectComponentClasses`](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-unregistered-classes.md#detectcomponentclasses) enabled ([#178](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/178))
- Fixes component classes not getting updated when inside an imported file ([#178](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/178))
- Disallow extra properties in rule options ([#180](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/180))

### ❤️ Contributors

- Andrew Kazakov ([@andreww2012](https://github.com/andreww2012))

## v3.6.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.6.0...v3.6.1)

### Fixes

- Recursively reading imports ([#175](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/175))

## v3.6.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.5.2...v3.6.0)

### Features

- New rule `enforce-consistent-important-position` ([#167](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/167))
- New rule `no-deprecated-classes` ([#169](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/169))

### Fixes

- Support starting important in `enforce-shorthand-classes` ([#164](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/164))
- Error position ([a55a6cc](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/a55a6cc))

## v3.5.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.5.1...v3.5.2)

### Fixes

- Tailwind 3 shorthand classes with important modifier ([#162](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/162))

## v3.5.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.5.0...v3.5.1)

### Fixes

- False reports of shorthand classes ([c5f14ab](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/c5f14ab))

## v3.5.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.4.4...v3.5.0)

### Features

- New Rule: Enforce shorthand classes ([#153](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/153))

### Fixes

- Bump tailwindcss peer dependency ([#157](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/157))
- Regex deprecation warning ([#161](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/161))

## v3.4.4

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.4.3...v3.4.4)

### Fixes

- Altering variant order in tailwindcss cache ([#151](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/151))

### Documentation

- Add example for arbitrary values ([ef6faa2](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/ef6faa2))

## v3.4.3

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.4.2...v3.4.3)

### Fixes

- Prevent removal of whitespace between template literals ([#147](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/147))
- Extract class variants via tailwind ([#146](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/146))

## v3.4.2

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.4.1...v3.4.2)

### Fixes

- Template literals resulting in `undefined` path in getESObjectPath causing false positives ([#142](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/142))

### ❤️ Contributors

- Long Zheng ([@longzheng](https://github.com/longzheng))

## v3.4.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.4.0...v3.4.1)

### Fixes

- Detect conflicts with multiple properties ([#137](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/137))

## v3.4.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.3.1...v3.4.0)

### Features

- Add customizable autofix option to `no-restricted-classes` ([#133](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/133))

### Refactors

- Rename rules for better consistency ([#134](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/134))

  - better-tailwindcss/multiline -> better-tailwindcss/enforce-consistent-line-wrapping
  - better-tailwindcss/sort-classes -> better-tailwindcss/enforce-consistent-class-order

  The old names will still work for now, but will be removed in the next major version.

## v3.3.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.3.0...v3.3.1)

### Fixes

- Prevent variable matchers from crossing arrow function boundaries ([#131](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/131))
- Sorting order with unregistered class with variant ([#132](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/132))

## v3.3.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.2.1...v3.3.0)

### Features

- No-restricted-classes rule to support custom error messages ([#129](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/129))

### Fixes

- Node version range ([b50df13](https://github.com/schoero/eslint-plugin-better-tailwindcss/commit/b50df13))

## v3.2.1

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.2.0...v3.2.1)

### Fixes

- Don't report inside member expressions ([#120](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/120))

## v3.2.0

[compare changes](https://github.com/schoero/eslint-plugin-better-tailwindcss/compare/v3.1.0...v3.2.0)

### Features

- Auto detect custom component layer classes ([#111](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/111))
- Ignore prefix in groups ([#110](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/110))
- Support prefixed groups and tags ([#115](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/115))

### Fixes

- Add additional tailwind variants matchers ([#116](https://github.com/schoero/eslint-plugin-better-tailwindcss/pull/116))

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
