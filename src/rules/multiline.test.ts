import { describe, it } from "vitest";

import { multiline } from "better-tailwindcss:rules/multiline.js";
import { getTailwindcssVersion, TailwindcssVersion } from "better-tailwindcss:tailwind/utils/version.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";
import { css, dedent, ts } from "better-tailwindcss:tests/utils/template.js";
import { MatcherType } from "better-tailwindcss:types/rule.js";


describe(multiline.name, () => {

  it("should not wrap empty strings", () => {
    lint(
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
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

  it("should not insert an empty line if the first class is already too long", () => {

    const dirty = "this-string-literal-is-exactly-54-characters-in-length";
    const clean = dedent`
      this-string-literal-is-exactly-54-characters-in-length
    `;

    lint(
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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

  it("should wrap string literals in call signature arguments matched by a regex", () => {

    const dirtyDefined = `defined(
      " a b c d e f g h ",
      {
        "nested": {
          "matched": " a b c d e f g h ",
        },
        "deeply": {
          "nested": {
            "unmatched": " a b c d e f g h ",
            "matched": " a b c d e f g h "
          },
        },
        "multiline": {
          "matched": \`
            a b c d e f g h 
          \`
        }
      }
    );`;

    const cleanDefined = `defined(
      \`
        a b c
        d e f
        g h
      \`,
      {
        "nested": {
          "matched": \`
            a b c
            d e f
            g h
          \`,
        },
        "deeply": {
          "nested": {
            "unmatched": " a b c d e f g h ",
            "matched": \`
              a b c
              d e f
              g h
            \`
          },
        },
        "multiline": {
          "matched": \`
            a b c
            d e f
            g h
          \`
        }
      }
    );`;

    lint(
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`,

            errors: 4,
            options: [{
              callees: [
                [
                  "defined\\(([^)]*)\\)",
                  "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                ],
                [
                  "defined\\(([^)]*)\\)",
                  "^\\s*[\"'`]([^\"'`]+)[\"'`](?!:)"
                ]
              ],
              classesPerLine: 3,
              indent: 2
            }]
          }
        ]
      }
    );

  });

  it("should change to a jsx expression correctly", () => {

    const singleLine = " a b c d e f g h ";
    const multipleLines = dedent`
      a b c
      d e f
      g h
    `;

    lint(
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            jsx: `() => <img class="${singleLine}" />`,
            jsxOutput: `() => <img class={\`${multipleLines}\`} />`,

            errors: 1,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            jsx: `() => <img class='${singleLine}' />`,
            jsxOutput: `() => <img class={\`${multipleLines}\`} />`,

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
        ],
        valid: [
          {
            jsx: `() => <img class={\`${multipleLines}\`} />`,
            svelte: `<img class={\`${multipleLines}\`} />`,

            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            angular: `<img class="${multipleLines}" />`,
            html: `<img class="${multipleLines}" />`,
            svelte: `<img class="${multipleLines}" />`,

            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            angular: `<img class='${multipleLines}' />`,
            html: `<img class='${multipleLines}' />`,
            svelte: `<img class='${multipleLines}' />`,

            options: [{ classesPerLine: 3, indent: 2 }]
          }
        ]
      }
    );
  });

  it("should wrap long lines on to multiple lines", () => {

    const singleLine = " a b c d e f g h ";
    const multipleLines = dedent`
      a b c
      d e f
      g h
    `;

    lint(multiline, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="${singleLine}" />`,
          angularOutput: `<img class="${multipleLines}" />`,
          html: `<img class="${singleLine}" />`,
          htmlOutput: `<img class="${multipleLines}" />`,
          jsx: `() => <img class="${singleLine}" />`,
          jsxOutput: `() => <img class={\`${multipleLines}\`} />`,
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
          jsxOutput: `() => <img class={\`${multipleLines}\`} />`,
          svelte: `<img class='${singleLine}' />`,
          svelteOutput: `<img class='${multipleLines}' />`,
          vue: `<template><img class='${singleLine}' /></template>`,
          vueOutput: `<template><img class='${multipleLines}' /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        },
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
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

  it("should wrap string literals in variable declarations matched by a regex", () => {

    const dirtyDefined = "const defined = 'a b c d e f g h';";
    const dirtyUndefined = "const notDefined = 'a b c d e f g h';";
    const cleanDefined = dedent`const defined = \`
      a b c
      d e f
      g h
    \`;`;

    const dirtyObject = dedent`const defined = {
      "matched": " a b c d e f g h ",
      "unmatched": " a b c d e f g h ",
      "nested": {
        "matched": " a b c d e f g h ",
        "unmatched": " a b c d e f g h "
      }
    };`;

    const cleanObject = dedent`const defined = {
      "matched": \`
        a b c
        d e f
        g h
      \`,
      "unmatched": " a b c d e f g h ",
      "nested": {
        "matched": \`
          a b c
          d e f
          g h
        \`,
        "unmatched": " a b c d e f g h "
      }
    };`;

    lint(
      multiline,
      TEST_SYNTAXES,
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
            options: [{
              classesPerLine: 3,
              indent: 2,
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "^\\s*[\"'`]([^\"'`]+)[\"'`]"
                ]
              ]
            }]
          },
          {
            jsx: dirtyObject,
            jsxOutput: cleanObject,
            svelte: `<script>${dirtyObject}</script>`,
            svelteOutput: `<script>${cleanObject}</script>`,
            vue: `<script>${dirtyObject}</script>`,
            vueOutput: `<script>${cleanObject}</script>`,

            errors: 2,
            options: [{
              classesPerLine: 3,
              indent: 2,
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                ]
              ]
            }]
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            svelte: `<script>${dirtyUndefined}</script>`,

            options: [{ classesPerLine: 3, indent: 2 }]
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
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
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
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="${dirty}" />`,
            angularOutput: `<img class="${clean}" />`,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />;`,
            jsxOutput: `() => <img class={\`${clean}\`} />;`,
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

  // #52
  it("should wrap expressions even if `group` is set to `never`", () => {

    const expression = "${true ? 'b' : 'c'}";

    const correct = dedent`
      a
      ${expression}
      d
    `;

    lint(
      multiline,
      TEST_SYNTAXES,
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
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            angularOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class={\`\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n\`} />`,
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
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            angularOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class={\`\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n\`} />`,
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
      multiline,
      TEST_SYNTAXES,
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
            jsxOutput: `() => <img class={\`\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n\`} />`,
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

  it("should remove duplicate classes in string literals in defined tagged template literals", () => {
    lint(
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            jsx: "defined` a b c d e f g h `",
            jsxOutput: "defined`\n  a b c\n  d e f\n  g h\n`",
            svelte: "<script>defined` a b c d e f g h `</script>",
            svelteOutput: "<script>defined`\n  a b c\n  d e f\n  g h\n`</script>",
            vue: "<script>defined` a b c d e f g h `</script>",
            vueOutput: "<script>defined`\n  a b c\n  d e f\n  g h\n`</script>",

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
            jsx: "notDefined` a b c d e f g h `",
            svelte: "<script>notDefined` a b c d e f g h `</script>",
            vue: "notDefined` a b c d e f g h `",

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

  it.runIf(getTailwindcssVersion().major <= TailwindcssVersion.V3)("should ignore prefixed variants in tailwind <= 3", () => {
    lint(
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            angularOutput: `<img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            html: `<img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            htmlOutput: `<img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            jsx: `() => <img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            jsxOutput: `() => <img class={\`\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n\`} />`,
            svelte: `<img class="tw-a tw-b hover:tw-c focus:tw-d" />`,
            svelteOutput: `<img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" />`,
            vue: `<template><img class="tw-a tw-b hover:tw-c focus:tw-d" /></template>`,
            vueOutput: `<template><img class="\n  tw-a tw-b\n  hover:tw-c\n  focus:tw-d\n" /></template>`,

            errors: 1,
            files: {
              "tailwind.config.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.js"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindcssVersion().major >= TailwindcssVersion.V4)("should ignore prefixed variants in tailwind >= 4", () => {
    lint(
      multiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            angularOutput: `<img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" />`,
            html: `<img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            htmlOutput: `<img class="\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n" />`,
            jsx: `() => <img class="tw:a tw:b tw:hover:c tw:focus:d" />`,
            jsxOutput: `() => <img class={\`\n  tw:a tw:b\n  tw:hover:c\n  tw:focus:d\n\`} />`,
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

});
