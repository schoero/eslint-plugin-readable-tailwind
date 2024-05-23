# Changelog

## v1.5.0

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.4.0...v1.5.0)

### Features

- Vue bound classes ([#31](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/31))

### Fixes

- Change quotes in multiline arrays ([#32](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/32))
- Escape nested quotes ([#33](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/33))
- Allow call expressions as object values ([#34](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/34))
- Attributes are no longer case sensitive ([#35](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/35))
- Warn in html matchers ([#36](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/36))
- Don't treat escape characters as whitespace ([6aa74f8](https://github.com/schoero/eslint-plugin-readable-tailwind/commit/6aa74f8))

### Refactors

- Simplify build system ([#26](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/26), [#29](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/29))

## v1.4.0

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.3.2...v1.4.0)

### Features

- Matchers ([#28](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/28))

## v1.3.2

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.3.1...v1.3.2)

### Fixes

- Remove unnecessary newline after single sticky class ([#23](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/23))
- Prevent inserting new line if the first class is already too long ([#24](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/24))

### Tests

- Simplify testing ([#22](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/22))

## v1.3.1

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.3.0...v1.3.1)

### Fixes

- Accept tabs ([#21](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/21))

## v1.3.0

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.2.5...v1.3.0)

### Features

- Add eslint 9 support ([#19](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/19))

### Chore

- Update dependencies ([be69b11](https://github.com/schoero/eslint-plugin-readable-tailwind/commit/be69b11))

## v1.2.5

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.2.4...v1.2.5)

### Performance

- Cache tailwind config and context ([#16](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/16))

### Fixes

- Resolving tailwind config ([#15](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/15))

## v1.2.4

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.2.3...v1.2.4)

### Fixes

- Sticky expressions ([#13](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/13))

## v1.2.3

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.2.2...v1.2.3)

### Fixes

- Remove unnecessary trailing spaces in multiline strings ([#12](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/12))
- False positives when using `crlf` ([#11](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/11))

## v1.2.2

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.2.1...v1.2.2)

### Fixes

- False positives of unnecessary whitespace around template literal elements ([#9](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/9))

## v1.2.1

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.2.0...v1.2.1)

### Fixes

- Don't wrap empty attributes ([#8](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/8))

## v1.2.0

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.1.1...v1.2.0)

### Features

- Lint variables ([#7](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/7))

### Fixes

- Apply nested regex only to container groups ([#6](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/6))

## v1.1.1

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.1.0...v1.1.1)

### Fixes

- Invalid collapsing with template literal expressions ([adfafbf](https://github.com/schoero/eslint-plugin-readable-tailwind/commit/adfafbf))

## v1.1.0

[compare changes](https://github.com/schoero/eslint-plugin-readable-tailwind/compare/v1.0.0...v1.1.0)

### Features

- Collapse unnecessary newlines ([#4](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/4))
- Regex as callees ([#3](https://github.com/schoero/eslint-plugin-readable-tailwind/pull/3))
