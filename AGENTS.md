# AGENTS.md

Guidance for coding agents and contributors working in this repository.

## Quick start

- Use npm for all commands.
- Install dependencies: `npm install`
- Run focused tests: `NODE_OPTIONS='' npm run test -- --run <path-to-test-file>`
- Run all unit tests: `npm run test -- --run`
- Lint + format markdown: `npm run lint:fix`
- Typecheck: `npm run typecheck`
- Full validation build: `npm run build`

## Rule authoring workflow

When you add or change a rule, update all of these:

1. Rule implementation: `src/rules/<rule-name>.ts`
2. Rule tests: `src/rules/<rule-name>.test.ts`
3. Rule registration: `src/configs/config.ts`
4. Rule documentation: `docs/rules/<rule-name>.md`
5. Rules table: `README.md`

If you skip one of these, CI or docs consistency will drift.

## Rule implementation conventions

- Create rules with `createRule(...)` from `src/utils/rule.ts`.
- Set metadata explicitly: `name`, `description`, `docs`, `category`, `recommended`, `autofix`.
- Use `category: "correctness"` for problem detection and `category: "stylistic"` for formatting/layout behavior.
- Keep `schema` option keys in alphabetical order.
- Use `strictObject` to disallow unknown options in `schema`.
- Prefer no autofix unless the transformation is deterministic and safe.
- Use `ctx.report({ id, range, ... })` and message ids from `messages`.
- For additional guidance links in diagnostics, include warnings (`warnings: [{ option, title, url }]`) instead of hardcoding long URLs in message text.

## Architecture

The plugin is built around a strict separation between parsing and linting:

- **Rules are parser-agnostic.** Rules never see an AST or any framework-specific syntax. Parsers (JSX, Vue, Svelte, Angular, HTML, CSS, ...) extract candidate strings and normalize them into `Literal` objects. Rules only receive these literals plus their metadata — never import from `src/parsers/*` in a rule.
- A `Literal` carries the class string (`content`), its `range`/`loc`, and parser-provided metadata (quotes, braces, interpolation state, whitespace, indentation, CSS-specific details). See the `Literal` type in `src/types/ast.ts` for the full shape.
- **Everything a rule needs flows through `ctx`** (`RuleContext` in `src/types/rule.ts`). Rules never read ESLint context, settings, or options directly.

### The `ctx` object

- `ctx.report({ id, data, fix?, warnings?, range })` — report a diagnostic. `id` must be a key of `messages`; `data` variables are type-checked against the message template. `fix` is the replacement text for the reported range. `warnings` forwards config warnings (see "Tailwind worker helpers").
- `ctx.options` — the rule's validated options (schema defaults applied) merged with the common options. See `CommonOptions` in `src/options/descriptions.ts`. Never read options from anywhere else.
- `ctx.version` — the detected Tailwind CSS version (`{ major, minor, patch }`). Gate version-specific behavior on `ctx.version.major`.
- `ctx.cwd` / `ctx.installation` — the working directory and Tailwind installation path used for resolution.
- `ctx.docs` — the rule's documentation URL (used by `augmentMessageWithWarnings`).
- `initialize(ctx)` — optional hook that runs once per rule before linting; use it to create worker getters.
- `lintLiterals(ctx, literals)` — the rule's entry point; receives all literals found by the parsers for the current file.

## Reusable helpers and parser metadata

- Tailwind class splitting and formatting helpers live in `src/utils/utils.ts`.
- Reuse helper predicates before adding new local versions.
- Literal metadata is parser-provided — see the `Literal` type in `src/types/ast.ts`.

### Core linting helpers

- `lintClasses(ctx, literal, report)` from `src/utils/lint.ts`: simplifies linting whole literals. It iterates every class in a literal, computes exact report ranges, and calls `ctx.report` for each non-empty callback result. Return a report descriptor (`{ id, data, fix?, warnings? }` or `{ message, fix?, warnings? }`) to report, or `false`/`undefined` to skip a class. Returning a `fix` also updates the shared `after` array so later iterations see already-fixed class names.
- `splitClasses(classes)` / `splitWhitespaces(classes)` from `src/utils/utils.ts`: split a class string into class chunks or whitespace chunks (aligned by index).
- `buildClass(ctx, parts)` from `src/utils/class.ts`: reassembles a class string from dissected parts (`variants`, `prefix`, `negative`, `base`, `important`), placing the prefix correctly for Tailwind v3 vs v4.
- `replacePlaceholders(template, match)` from `src/utils/utils.ts`: substitutes `$1…$n` placeholders with regex capture groups (used to build fix strings).
- `getCachedRegex(pattern, flags?)` from `src/async-utils/regex.ts`: cached `RegExp` factory; prefer it over `new RegExp` for option-derived patterns.
- `display(messageStyle, classes)`, `deduplicateClasses(classes)`, `isClassSticky(literal, classIndex)`, `augmentMessageWithWarnings(message, docs, warnings)` from `src/utils/utils.ts`: message formatting, deduping (first occurrence wins), interpolation-safety check before reordering/removing a class, and prepending warning links to messages.

### Tailwind worker helpers

Helpers under `src/tailwindcss/*.ts` come in `createGetX` / `getX` pairs backed by a synckit worker. Call `createGetX(ctx)` once in the rule's `initialize`, then call `getX(async(ctx), ...)` inside `lintLiterals` (`async()` from `src/utils/context.ts` builds the serializable worker context). Every getter returns `{ ..., warnings }` — forward `warnings` into `ctx.report` so misconfiguration is surfaced.

- `createGetDissectedClasses` / `getDissectedClasses(ctx, classes)` from `src/tailwindcss/dissect-classes.ts`: dissects tailwind classes into their individual parts (variants, modifiers etc.). Returns `{ dissectedClasses }` mapping each class to a `DissectedClass` (see `src/tailwindcss/dissect-classes.ts`; `variants` is `undefined` in Tailwind v4 for non-tailwind classes).
- `createGetClassOrder` / `getClassOrder(ctx, classes)` from `src/tailwindcss/class-order.ts`: Tailwind's internal sort weight per class.
- `createGetVariantOrder` / `getVariantOrder(ctx, classes)` from `src/tailwindcss/variant-order.ts`: sort order index per variant.
- `createGetUnknownClasses` / `getUnknownClasses(ctx, classes)` from `src/tailwindcss/unknown-classes.ts`: classes not registered in the Tailwind design system.
- `createGetConflictingClasses` / `getConflictingClasses(ctx, classes)` from `src/tailwindcss/conflicting-classes.ts`: classes that write the same CSS properties.
- `createGetCanonicalClasses` / `getCanonicalClasses(ctx, classes, options)` from `src/tailwindcss/canonical-classes.ts`: canonical/collapsed form per class.
- `createGetCustomComponentClasses` / `getCustomComponentClasses(ctx)` from `src/tailwindcss/custom-component-classes.ts`: custom component class names (only initialize when `ctx.options.detectComponentClasses` is enabled).
- `createGetPrefix` / `getPrefix(ctx)` from `src/tailwindcss/prefix.ts`: configured Tailwind prefix/suffix.

Rules that only need pure string checks (for example `no-unnecessary-whitespace`, `no-duplicate-classes`) don't need `initialize` at all.

## Testing rules

- Use the `lint(...)` helper from `tests/utils/lint.ts`.
- Supported parser keys in tests: `angular`, `astro`, `css`, `html`, `jsx`, `svelte`, `vue`.
- Use `invalid` cases only where syntax is valid for that parser.
- Include `errors` assertions for invalid cases.
- Include `*Output` only for autofix-enabled behavior.
- For parser-unsupported syntax (for example dynamic JS expressions in HTML/CSS), include valid static coverage instead of forcing invalid cases.

## Validation checklist before finishing

1. Focused tests for changed rules pass.
2. `npm run eslint` passes.
3. `npm run build` passes (includes typecheck, lint, spellcheck, build).
4. Documentation and README entries match rule metadata (recommended/autofix/category).

## Commit guidance

- Don't commit
