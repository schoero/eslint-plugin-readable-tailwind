import eslintParserHTML from "@html-eslint/parser";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { enforceConsistentLineWrapping } from "better-tailwindcss:rules/enforce-consistent-line-wrapping.js";
import { eslint } from "better-tailwindcss:tests/utils/eslint.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { prettier } from "better-tailwindcss:tests/utils/prettier.js";
import { css, dedent, jsx, ts } from "better-tailwindcss:tests/utils/template.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version";
import { MatcherType } from "better-tailwindcss:types/rule.js";

import eslintPluginBetterTailwindcss from "../configs/config.js";


describe(enforceConsistentLineWrapping.name, () => {

  it("should not wrap empty strings", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            angular: `<img class="" />`,
            html: `<img class="" />`,
            jsx: `() => <img class="" />`,
            svelte: `<img class="" />`,
            vue: `<template><img class="" /></template>`
          },
          {
            angular: `<img class='' />`,
            html: `<img class='' />`,
            jsx: `() => <img class='' />`,
            svelte: `<img class='' />`,
            vue: `<template><img class='' /></template>`
          },
          {
            jsx: `() => <img class={""} />`,
            svelte: `<img class={""} />`
          },
          {
            jsx: `() => <img class={''} />`,
            svelte: `<img class={''} />`
          },
          {
            jsx: `() => <img class={\`\`} />`,
            svelte: `<img class={\`\`} />`
          }
        ]
      }
    );
  });

  it("should not wrap short lines", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            angular: `<img class="a b c" />`,
            html: `<img class="a b c" />`,
            jsx: `() => <img class="a b c" />`,
            svelte: `<img class="a b c" />`,
            vue: `<template><img class="a b c" /></template>`
          },
          {
            angular: `<img class='a b c' />`,
            html: `<img class='a b c' />`,
            jsx: `() => <img class='a b c' />`,
            svelte: `<img class='a b c' />`,
            vue: `<template><img class='a b c' /></template>`
          },
          {
            jsx: `() => <img class={"a b c"} />`,
            svelte: `<img class={"a b c"} />`
          },
          {
            jsx: `() => <img class={'a b c'} />`,
            svelte: `<img class={'a b c'} />`
          },
          {
            jsx: `() => <img class={\`a b c\`} />`,
            svelte: `<img class={\`a b c\`} />`
          }
        ]
      }
    );
  });

  it("should collapse unnecessarily wrapped short lines", () => {

    const dirty = dedent`
      a b
    `;

    const clean = "a b";

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class={\`${dirty}\`} />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`,

            errors: 1,
            options: [{ printWidth: 60 }]
          }
        ]
      }
    );
  });

  it("should not clean up whitespace in single line strings", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            angular: `<img class="  a  b  c  " />`,
            html: `<img class="  a  b  c  " />`,
            jsx: `() => <img class="  a  b  c  " />`,
            svelte: `<img class="  a  b  c  " />`,
            vue: `<template><img class="  a  b  c  " /></template>`,

            options: [{ printWidth: 60 }]
          }
        ]
      }
    );
  });

  it("should wrap and not collapse short lines containing expressions", () => {

    const expression = "${true ? 'true' : 'false'}";

    const incorrect = dedent`
      a ${expression}
    `;

    const correct = dedent`
      a
      ${expression}
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="{{\`${incorrect}\`}}" />`,
            angularOutput: `<img class="{{\`${correct}\`}}" />`,
            jsx: `() => <img class={\`${incorrect}\`} />`,
            jsxOutput: `() => <img class={\`${correct}\`} />`,
            svelte: `<img class={\`${incorrect}\`} />`,
            svelteOutput: `<img class={\`${correct}\`} />`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should include previous characters to decide if lines should be wrapped", () => {

    const dirty = "this string literal is exactly 54 characters in length";
    const clean = dedent`
      this string literal is exactly 54 characters in length
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class="${clean}" />`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`,

            errors: 1,
            options: [{ printWidth: 60 }]
          }
        ]
      }
    );
  });

  it("should not insert an empty line if the first class is already too long", () => {

    const dirty = "this-string-literal-is-exactly-54-characters-in-length";
    const clean = dedent`
      this-string-literal-is-exactly-54-characters-in-length
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class="${clean}" />`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`,

            errors: 1,
            options: [{ printWidth: 50 }]
          }
        ]
      }
    );
  });

  it("should disable the `printWidth` limit when set to `0`", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            angular: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            html: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            jsx: `() => <img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            svelte: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            vue: `<template><img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" /></template>`,

            options: [{ printWidth: 0 }]
          }
        ]
      }
    );
  });

  it("should change the quotes in defined call signatures to backticks", () => {

    const dirtyDefined = "defined('a b c d e f g h')";

    const cleanDefined = dedent`defined(\`
      a b c
      d e f
      g h
    \`)`;

    const dirtyUndefined = "notDefined('a b c d e f g h')";

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={${dirtyDefined}} />`,
            jsxOutput: `() => <img class={${cleanDefined}} />`,
            svelte: `<img class={${dirtyDefined}} />`,
            svelteOutput: `<img class={${cleanDefined}} />`,

            errors: 1,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }]
          }
        ],
        valid: [
          {
            jsx: `() => <img class={${dirtyUndefined}} />`,
            svelte: `<img class={${dirtyUndefined}} />`,

            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={${dirtyDefined}} />`,
            jsxOutput: `() => <img class={${cleanDefined}} />`,
            svelte: `<img class={${dirtyDefined}} />`,
            svelteOutput: `<img class={${cleanDefined}} />`,

            errors: 1,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }]
          }
        ],
        valid: [
          {
            jsx: `() => <img class={${dirtyUndefined}} />`,
            svelte: `<img class={${dirtyUndefined}} />`,

            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should change the quotes in defined variables to backticks", () => {

    const dirtyDefined = `const defined = "a b c d e f g h"`;

    const cleanDefined = dedent`const defined = \`
      a b c
      d e f
      g h
    \``;

    const dirtyUndefined = `const notDefined = "a b c d e f g h"`;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }]
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            svelte: `<script>${dirtyUndefined}</script>`,

            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }]
          }
        ]
      }
    );

  });

  it("should change the quotes in conditional expressions to backticks", () => {

    const dirtyConditionalExpression = `true ? "1 2 3 4 5 6 7 8" : "9 10 11 12 13 14 15 16"`;
    const cleanConditionalExpression = `true ? \`\n  1 2 3\n  4 5 6\n  7 8\n\` : \`\n  9 10 11\n  12 13 14\n  15 16\n\``;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={${dirtyConditionalExpression}} />`,
            jsxOutput: `() => <img class={${cleanConditionalExpression}} />`,
            svelte: `<img class={${dirtyConditionalExpression}} />`,
            svelteOutput: `<img class={${cleanConditionalExpression}} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should change the quotes in logical expressions to backticks", () => {

    const dirtyLogicalExpression = `true && "1 2 3 4 5 6 7 8"`;
    const cleanLogicalExpression = `true && \`\n  1 2 3\n  4 5 6\n  7 8\n\``;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={${dirtyLogicalExpression}} />`,
            jsxOutput: `() => <img class={${cleanLogicalExpression}} />`,
            svelte: `<img class={${dirtyLogicalExpression}} />`,
            svelteOutput: `<img class={${cleanLogicalExpression}} />`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should change the quotes in arrays to backticks", () => {

    const dirtyArray = `["1 2 3 4 5 6 7 8", "9 10 11 12 13 14 15 16"]`;
    const cleanArray = `[\`\n  1 2 3\n  4 5 6\n  7 8\n\`, \`\n  9 10 11\n  12 13 14\n  15 16\n\`]`;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={${dirtyArray}} />`,
            jsxOutput: `() => <img class={${cleanArray}} />`,
            svelte: `<img class={${dirtyArray}} />`,
            svelteOutput: `<img class={${cleanArray}} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should always preserve the original quotes in attributes", () => {

    const singleLine = " a b c d e f g h ";
    const multipleLines = dedent`
      a b c
      d e f
      g h
    `;

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          angular: `<img class="${singleLine}" />`,
          angularOutput: `<img class="${multipleLines}" />`,
          html: `<img class="${singleLine}" />`,
          htmlOutput: `<img class="${multipleLines}" />`,
          jsx: `() => <img class="${singleLine}" />`,
          jsxOutput: `() => <img class="${multipleLines}" />`,
          svelte: `<img class="${singleLine}" />`,
          svelteOutput: `<img class="${multipleLines}" />`,
          vue: `<template><img class="${singleLine}" /></template>`,
          vueOutput: `<template><img class="${multipleLines}" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        },
        {
          angular: `<img class='${singleLine}' />`,
          angularOutput: `<img class='${multipleLines}' />`,
          html: `<img class='${singleLine}' />`,
          htmlOutput: `<img class='${multipleLines}' />`,
          jsx: `() => <img class='${singleLine}' />`,
          jsxOutput: `() => <img class='${multipleLines}' />`,
          svelte: `<img class='${singleLine}' />`,
          svelteOutput: `<img class='${multipleLines}' />`,
          vue: `<template><img class='${singleLine}' /></template>`,
          vueOutput: `<template><img class='${multipleLines}' /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        }
      ]
    });
  });

  it("should change the quotes to backticks in attribute expressions", () => {

    const singleLine = " a b c d e f g h ";
    const multipleLines = dedent`
      a b c
      d e f
      g h
    `;

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          jsx: `() => <img class={\`${singleLine}\`} />`,
          jsxOutput: `() => <img class={\`${multipleLines}\`} />`,
          svelte: `<img class={\`${singleLine}\`} />`,
          svelteOutput: `<img class={\`${multipleLines}\`} />`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        },
        {
          jsx: `() => <img class={"${singleLine}"} />`,
          jsxOutput: `() => <img class={\`${multipleLines}\`} />`,
          svelte: `<img class={"${singleLine}"} />`,
          svelteOutput: `<img class={\`${multipleLines}\`} />`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        },
        {
          jsx: `() => <img class={'${singleLine}'} />`,
          jsxOutput: `() => <img class={\`${multipleLines}\`} />`,
          svelte: `<img class={'${singleLine}'} />`,
          svelteOutput: `<img class={\`${multipleLines}\`} />`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        }
      ]
    });
  });

  it("should wrap expressions correctly", () => {

    const expression = "${true ? 'true' : 'false'}";

    const singleLineWithExpressionAtBeginning = `${expression} a b c d e f g h `;
    const multilineWithExpressionAtBeginning = dedent`
      ${expression}
      a b c
      d e f
      g h
    `;

    const singleLineWithExpressionInCenter = `a b c ${expression} d e f g h `;
    const multilineWithExpressionInCenter = dedent`
      a b c
      ${expression}
      d e f
      g h
    `;

    const singleLineWithExpressionAtEnd = `a b c d e f g h ${expression}`;
    const multilineWithExpressionAtEnd = dedent`
      a b c
      d e f
      g h
      ${expression}
    `;

    const singleLineWithClassesAroundExpression = `a b ${expression} c d e f g h `;
    const multilineWithClassesAroundExpression = dedent`
      a b
      ${expression}
      c d e f
      g h
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtBeginning}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtBeginning}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class={\`${singleLineWithExpressionInCenter}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionInCenter}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionInCenter}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenter}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class={\`${singleLineWithExpressionAtEnd}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtEnd}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtEnd}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class={\`${singleLineWithClassesAroundExpression}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithClassesAroundExpression}\`} />`,
            svelte: `<img class={\`${singleLineWithClassesAroundExpression}\`} />`,
            svelteOutput: `<img class={\`${multilineWithClassesAroundExpression}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 4, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should not place expressions on a new line when the expression is not surrounded by a space", () => {

    const expression = "${true ? 'true' : 'false'}";

    const singleLineWithExpressionAtBeginningWithStickyClassAtEnd = `${expression}a b c d e f g h `;
    const multilineWithExpressionAtBeginningWithStickyClassAtEnd = dedent`
      ${expression}a
      b c d
      e f g
      h
    `;

    const singleLineWithExpressionInCenterWithStickyClassAtBeginning = `a b c${expression} d e f g h `;
    const multilineWithExpressionInCenterWithStickyClassAtBeginning = dedent`
      a b
      c${expression}
      d e f
      g h
    `;

    const singleLineWithExpressionInCenterWithStickyClassAtEnd = `a b c ${expression}d e f g h `;
    const multilineWithExpressionInCenterWithStickyClassAtEnd = dedent`
      a b c
      ${expression}d
      e f g
      h
    `;

    const singleLineWithExpressionAtEndWithStickyClassAtBeginning = `a b c d e f g h${expression}`;
    const multilineWithExpressionAtEndWithStickyClassAtBeginning = dedent`
      a b c
      d e f
      g
      h${expression}
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class={\`${singleLineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class={\`${singleLineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class={\`${singleLineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class={\`${singleLineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            svelte: `<img class={\`${singleLineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,

            errors: 2,
            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should not add an unnecessary new line after a sticky class", () => {

    const expression = "${true ? 'true' : 'false'}";

    const multilineWithWithStickyClassAtEnd = dedent`
      ${expression}a
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            jsx: `() => <img class={\`${multilineWithWithStickyClassAtEnd}\`} />`,
            svelte: `<img class={\`${multilineWithWithStickyClassAtEnd}\`} />`,

            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );

  });

  it("should wrap string literals in variable declarations", () => {

    const dirtyDefined = "const defined = 'a b c d e f g h';";
    const dirtyUndefined = "const notDefined = 'a b c d e f g h';";
    const cleanDefined = dedent`const defined = \`
      a b c
      d e f
      g h
    \`;`;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }]
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            svelte: `<script>${dirtyUndefined}</script>`,

            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }]
          }
        ]
      }
    );

  });

  it("should never wrap in an object key", () => {

    const dirtyObject = dedent`const obj = {
      "a b c d e f g h": "a b c d e f g h"
    };`;
    const cleanObject = dedent`const obj = {
      "a b c d e f g h": \`
        a b c
        d e f
        g h
      \`
    };`;

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: dirtyObject,
            jsxOutput: cleanObject,
            svelte: `<script>${dirtyObject}</script>`,
            svelteOutput: `<script>${cleanObject}</script>`,
            vue: `<script>${dirtyObject}</script>`,
            vueOutput: `<script>${cleanObject}</script>`,

            errors: 1,
            options: [{
              classesPerLine: 3,
              indent: 2,
              variables: [
                ["obj", [{ match: MatcherType.ObjectKey }, { match: MatcherType.ObjectValue }]]
              ]
            }]
          }
        ]
      }
    );

  });

  it("should be possible to change the lineBreakStyle to windows", () => {

    const dirty = " a b c d e f g h ";
    const clean = "\r\n  a b c\r\n  d e f\r\n  g h\r\n";

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class="${clean}" />`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: 2, lineBreakStyle: "windows" }]
          }
        ]
      }
    );

  });

  it("should be possible to change the indentation style to tabs", () => {

    const dirty = " a b c d e f g h ";
    const clean = "\n\ta b c\n\td e f\n\tg h\n";

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />;`,
            jsxOutput: `() => <img class="${clean}" />;`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: "tab" }]
          }
        ]
      }
    );
  });

  it("should use tabWidth when checking printWidth", () => {

    const dirty = "a b c d";
    const clean = "\n\ta b c\n\td\n";

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class="${clean}" />`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,

            errors: 1,
            options: [{ classesPerLine: 0, indent: "tab", printWidth: 10, tabWidth: 4 }]
          }
        ]
      }
    );
  });

  it("should default tabWidth to 1 when it is not configured", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class="a b c d" />`,
            jsxOutput: `() => <img class="\n\ta b c d\n" />`,
            svelte: `<img class="a b c d" />`,
            svelteOutput: `<img class="\n\ta b c d\n" />`,

            errors: 1,
            options: [{ classesPerLine: 0, indent: "tab", printWidth: 10 }]
          }
        ]
      }
    );
  });

  it("should not apply tabWidth when indentation uses spaces", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class="a b c d" />`,
            jsxOutput: `() => <img class="\n  a b c d\n" />`,
            svelte: `<img class="a b c d" />`,
            svelteOutput: `<img class="\n  a b c d\n" />`,

            errors: 1,
            options: [{ classesPerLine: 0, indent: 2, printWidth: 10, tabWidth: 8 }]
          }
        ]
      }
    );
  });

  it("should still ignore printWidth when it is set to 0 even with tabWidth", () => {

    const dirty = "a b c d";
    const clean = "\n\ta b c\n\td\n";

    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class="${clean}" />`,
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: "tab", printWidth: 0, tabWidth: 4 }]
          }
        ]
      }
    );
  });

  it("should warn if `lineBreakStyle` is likely misconfigured", async () => {
    {

      const linter = new ESLint({
        baseConfig: [{
          languageOptions: {
            parser: eslintParserHTML
          },
          plugins: {
            "better-tailwindcss": eslintPluginBetterTailwindcss
          },
          rules: {
            "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
              classesPerLine: 3,
              indent: 2,
              lineBreakStyle: "unix"
            }]
          }
        }],
        overrideConfigFile: true
      });

      const [result] = await linter.lintText("<img class=\"\r\n  a b c d\r\n\" />");
      const { message } = result.messages.find(message => message.ruleId === "better-tailwindcss/enforce-consistent-line-wrapping")!;

      expect(message).toContain("Inconsistent line endings detected");
      expect(message).toContain("Option `lineBreakStyle` may be misconfigured.");
      expect(message).toContain(`${enforceConsistentLineWrapping.rule.meta.docs.url}#linebreakstyle`);
    }
    {
      const linter = new ESLint({
        baseConfig: [{
          languageOptions: {
            parser: eslintParserHTML
          },
          plugins: {
            "better-tailwindcss": eslintPluginBetterTailwindcss
          },
          rules: {
            "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
              classesPerLine: 3,
              indent: 2,
              lineBreakStyle: "windows"
            }]
          }
        }],
        overrideConfigFile: true
      });

      const [result] = await linter.lintText("<img class=\"\n  a b c d\n\" />");
      const { message } = result.messages.find(message => message.ruleId === "better-tailwindcss/enforce-consistent-line-wrapping")!;

      expect(message).toContain("Inconsistent line endings detected");
      expect(message).toContain("Option `lineBreakStyle` may be misconfigured.");
      expect(message).toContain(`${enforceConsistentLineWrapping.rule.meta.docs.url}#linebreakstyle`);
    }
  });

  it("should warn if `indent` is likely misconfigured", async () => {
    const linter = new ESLint({
      baseConfig: [{
        languageOptions: {
          parser: eslintParserHTML
        },
        plugins: {
          "better-tailwindcss": eslintPluginBetterTailwindcss
        },
        rules: {
          "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
            classesPerLine: 3,
            indent: 2
          }]
        }
      }],
      overrideConfigFile: true
    });

    const [result] = await linter.lintText("<img class=\"\n\ta b c d\n\" />");
    const { message } = result.messages.find(message => message.ruleId === "better-tailwindcss/enforce-consistent-line-wrapping")!;

    expect(message).toContain("Inconsistent indentation detected");
    expect(message).toContain("Option `indent` may be misconfigured.");
    expect(message).toContain(`${enforceConsistentLineWrapping.rule.meta.docs.url}#indent`);
  });

  it("should not warn for double spaces between classes", async () => {
    const linter = new ESLint({
      baseConfig: [{
        languageOptions: {
          parser: eslintParserHTML
        },
        plugins: {
          "better-tailwindcss": eslintPluginBetterTailwindcss
        },
        rules: {
          "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
            classesPerLine: 3,
            indent: "tab"
          }]
        }
      }],
      overrideConfigFile: true
    });

    const [result] = await linter.lintText("<img class=\"a  b c d\" />");
    const { message } = result.messages.find(message => message.ruleId === "better-tailwindcss/enforce-consistent-line-wrapping")!;

    expect(message).not.toContain("Inconsistent indentation detected");
    expect(message).not.toContain("Option `indent` may be misconfigured.");
  });

  it("should not warn for leading spaces in single-line class strings", async () => {
    const linter = new ESLint({
      baseConfig: [{
        languageOptions: {
          parser: eslintParserHTML
        },
        plugins: {
          "better-tailwindcss": eslintPluginBetterTailwindcss
        },
        rules: {
          "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
            classesPerLine: 3,
            indent: "tab"
          }]
        }
      }],
      overrideConfigFile: true
    });

    const [result] = await linter.lintText("<img class=\" a b c d\" />");
    const { message } = result.messages.find(message => message.ruleId === "better-tailwindcss/enforce-consistent-line-wrapping")!;

    expect(message).not.toContain("Inconsistent indentation detected");
    expect(message).not.toContain("Option `indent` may be misconfigured.");
  });

  // #52
  it("should wrap expressions even if `group` is set to `never`", () => {
    const expression = "${true ? 'b' : 'c'}";

    const correct = dedent`
      a
      ${expression}
      d
    `;

    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            jsx: `() => <img class={\`${correct}\`} />`,
            svelte: `<img class={\`${correct}\`} />`,

            options: [{ group: "never", indent: 2 }]
          }
        ]
      }
    );
  });

  it("should be possible to change group separation by emptyLines", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            angularOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelteOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,
            vueOutput: `<template><img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" /></template>`,

            errors: 1,
            options: [{ group: "emptyLine", indent: 2 }]
          }
        ]
      }
    );
  });

  it("should be possible to change group separation to emptyLine", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            angularOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelteOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,
            vueOutput: `<template><img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" /></template>`,

            errors: 1,
            options: [{ group: "emptyLine", indent: 2 }]
          }
        ]
      }
    );
  });

  it("should be wrap groups according to preferSingleLine", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            angularOutput: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            html: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            htmlOutput: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsx: `() => <img class={\`\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n\`} />`,
            jsxOutput: `() => <img class={\`a b c g-1:a g-1:b g-2:a g-2:b\`} />`,
            svelte: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            svelteOutput: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            vue: `<template><img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" /></template>`,
            vueOutput: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,

            errors: 1,
            options: [{ indent: 2, preferSingleLine: true }]
          },
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            angularOutput: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelteOutput: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,
            vueOutput: `<template><img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" /></template>`,

            errors: 1,
            options: [{ classesPerLine: 6, indent: 2, preferSingleLine: true, printWidth: 0 }]
          }
        ],
        valid: [
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,

            options: [{ indent: 2, preferSingleLine: true }]
          }
        ]
      }
    );
  });

  it("should still start on a new line when `group` is set to `never` except if `preferSingleLine` is enabled", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            angular: `<img class="\n  a b hover:c\n" />`,
            html: `<img class="\n  a b hover:c\n" />`,
            jsx: `() => <img class="\n  a b hover:c\n" />`,
            svelte: `<img class="\n  a b hover:c\n" />`,
            vue: `<template><img class="\n  a b hover:c\n" /></template>`,

            options: [{ group: "never", preferSingleLine: false, printWidth: 100 }]
          },
          {
            angular: `<img class="a b hover:c" />`,
            html: `<img class="a b hover:c" />`,
            jsx: `() => <img class="a b hover:c" />`,
            svelte: `<img class="a b hover:c" />`,
            vue: `<template><img class="a b hover:c" /></template>`,

            options: [{ group: "never", preferSingleLine: true, printWidth: 100 }]
          }
        ]
      }
    );
  });

  it("should remove duplicate classes in string literals in defined tagged template literals", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            jsx: "defined` a b c d e f g `",
            jsxOutput: "defined`\n  a b c\n  d e f\n  g\n`",
            svelte: "<script>defined` a b c d e f g`</script>",
            svelteOutput: "<script>defined`\n  a b c\n  d e f\n  g\n`</script>",
            vue: "<script>defined` a b c d e f g`</script>",
            vueOutput: "<script>defined`\n  a b c\n  d e f\n  g\n`</script>",

            errors: 1,
            options: [{
              classesPerLine: 3,
              indent: 2,
              tags: ["defined"]
            }]
          }
        ],
        valid: [
          {
            jsx: "notDefined` a b c d e f g`",
            svelte: "<script>notDefined` a b c d e f g`</script>",
            vue: "notDefined` a b c d e f g`",

            options: [{
              classesPerLine: 3,
              indent: 2,
              tags: ["defined"]
            }]
          }
        ]
      }
    );

  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should ignore prefixed variants in tailwind <= 3", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            angularOutput: `<img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            html: `<img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            htmlOutput: `<img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            jsx: `() => <img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            jsxOutput: `() => <img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            svelte: `<img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            svelteOutput: `<img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            vue: `<template><img class="tw-a tw-b hover:tw-c focus:tw-d" /></template>`,
            vueOutput: `<template><img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" /></template>`,

            errors: 1,
            files: {
              "tailwind.config.prefix.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.prefix.js"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should ignore prefixed variants in tailwind >= 4", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        invalid: [
          {
            angular: `<img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            angularOutput: `<img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" />`,
            html: `<img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            htmlOutput: `<img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" />`,
            jsx: `() => <img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            jsxOutput: `() => <img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" />`,
            svelte: `<img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            svelteOutput: `<img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" />`,
            vue: `<template><img class="tw:a tw:b tw:hover:c tw:focus:d" /></template>`,
            vueOutput: `<template><img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" /></template>`,

            errors: 1,
            files: {
              "tailwind.css": css`
                @import "tailwindcss" prefix(tw);
              `
            },
            options: [{
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it("should not group arbitrary styles differently", () => {
    lint(
      enforceConsistentLineWrapping,
      {
        valid: [
          {
            jsx: `() => <div class="md:w-full md:[height:_100px]" />`
          }
        ]
      }
    );
  });

  describe("prettier compatibility", () => {
    const iterations = [
      jsx`
        () => (
          <img class="font-bold text-blue" />
        );
      `,
      jsx`
        () => (
          <img class="
            font-bold text-blue
          " />
        );
      `,
      jsx`
        () => (
          <img
            class="
            font-bold text-blue
          "
          />
        );
      `,
      jsx`
        () => (
          <img
            class="font-bold text-blue"
          />
        );
      `,
      jsx`
        () => (
          <img class="font-bold text-blue" />
        );
      `
    ];

    const cases = [
      { input: iterations[0], name: "eslint line wrapping", output: iterations[1] },
      { input: iterations[1], name: "prettier class attribute newline", output: iterations[2] },
      { input: iterations[2], name: "eslint line collapsing", output: iterations[3] },
      { input: iterations[3], name: "prettier class attribute collapsing", output: iterations[4] }
    ];

    it.each(cases)("should conflict with prettier iteration $name", async currentCase => {
      const index = cases.indexOf(currentCase);

      const output = index % 2 === 0
        ? await eslint(
          currentCase.input,
          [{
            languageOptions: {
              parser: eslintParserHTML
            },
            plugins: {
              "better-tailwindcss": eslintPluginBetterTailwindcss
            },
            rules: {
              "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
                printWidth: 32,
                strictness: "strict"
              }]
            }
          }]
        )
        : await prettier(
          currentCase.input,
          {
            parser: "babel",
            printWidth: 32
          }
        );

      expect(output.trim()).toBe(currentCase.output);
    });

    it(`should not conflict with prettier when "strictness" is set to "loose"`, async () => {
      const input = iterations[0];

      const eslintOutput = await eslint(
        input,
        [{
          languageOptions: {
            parser: eslintParserHTML
          },
          plugins: {
            "better-tailwindcss": eslintPluginBetterTailwindcss
          },
          rules: {
            "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {
              printWidth: 32,
              strictness: "loose"
            }]
          }
        }]
      );

      const prettierOutput = await prettier(
        eslintOutput,
        {
          parser: "babel",
          printWidth: 32
        }
      );

      expect(eslintOutput.trim()).toBe(input.trim());
      expect(eslintOutput.trim()).toBe(prettierOutput.trim());
    });
  });
});
