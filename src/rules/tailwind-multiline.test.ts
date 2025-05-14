import { describe, it } from "vitest";

import { multiline } from "better-tailwindcss:rules:tailwind-multiline.js";
import { createTrimTag, lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";
import { MatcherType } from "better-tailwindcss:types:rule.js";


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

    const trim = createTrimTag(4);

    const dirty = trim`
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
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class={\`${dirty}\`} />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
            options: [{ printWidth: 60 }],
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`
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
            options: [{ printWidth: 60 }],
            svelte: `<img class="  a  b  c  " />`,
            vue: `<template><img class="  a  b  c  " /></template>`
          }
        ]
      }
    );
  });

  it("should wrap and not collapse short lines containing expressions", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? 'true' : 'false'}";

    const incorrect = trim`
      a ${expression}
    `;

    const correct = trim`
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
            errors: 1,
            jsx: `() => <img class={\`${incorrect}\`} />`,
            jsxOutput: `() => <img class={\`${correct}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${incorrect}\`} />`,
            svelteOutput: `<img class={\`${correct}\`} />`
          }
        ]
      }
    );

  });

  it("should include previous characters to decide if lines should be wrapped", () => {

    const trim = createTrimTag(4);

    const dirty = "this string literal is exactly 54 characters in length";
    const clean = trim`
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
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
            options: [{ printWidth: 60 }],
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`
          }
        ]
      }
    );
  });

  it("should not insert an empty line if the first class is already too long", () => {

    const trim = createTrimTag(4);

    const dirty = "this-string-literal-is-exactly-54-characters-in-length";
    const clean = trim`
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
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
            options: [{ printWidth: 50 }],
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`
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
            options: [{ printWidth: 0 }],
            svelte: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            vue: `<template><img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" /></template>`
          }
        ]
      }
    );
  });

  it("should change the quotes in defined call signatures to backticks", () => {

    const trim = createTrimTag(4);

    const dirtyDefined = "defined('a b c d e f g h')";

    const cleanDefined = trim`defined(\`
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
            errors: 1,
            jsx: `() => <img class={${dirtyDefined}} />`,
            jsxOutput: `() => <img class={${cleanDefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyDefined}} />`,
            svelteOutput: `<img class={${cleanDefined}} />`
          }
        ],
        valid: [
          {
            jsx: `() => <img class={${dirtyUndefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyUndefined}} />`
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
            errors: 1,
            jsx: `() => <img class={${dirtyDefined}} />`,
            jsxOutput: `() => <img class={${cleanDefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyDefined}} />`,
            svelteOutput: `<img class={${cleanDefined}} />`
          }
        ],
        valid: [
          {
            jsx: `() => <img class={${dirtyUndefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyUndefined}} />`
          }
        ]
      }
    );

  });

  it("should change the quotes in defined variables to backticks", () => {

    const trim = createTrimTag(4);

    const dirtyDefined = `const defined = "a b c d e f g h"`;

    const cleanDefined = trim`const defined = \`
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
            errors: 1,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }],
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }],
            svelte: `<script>${dirtyUndefined}</script>`
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
            errors: 2,
            jsx: `() => <img class={${dirtyConditionalExpression}} />`,
            jsxOutput: `() => <img class={${cleanConditionalExpression}} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyConditionalExpression}} />`,
            svelteOutput: `<img class={${cleanConditionalExpression}} />`
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
            errors: 1,
            jsx: `() => <img class={${dirtyLogicalExpression}} />`,
            jsxOutput: `() => <img class={${cleanLogicalExpression}} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyLogicalExpression}} />`,
            svelteOutput: `<img class={${cleanLogicalExpression}} />`
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
            errors: 2,
            jsx: `() => <img class={${dirtyArray}} />`,
            jsxOutput: `() => <img class={${cleanArray}} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyArray}} />`,
            svelteOutput: `<img class={${cleanArray}} />`
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
            errors: 4,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
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
            }],
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`
          }
        ]
      }
    );

  });

  it("should change to a jsx expression correctly", () => {

    const trim = createTrimTag(4);

    const singleLine = " a b c d e f g h ";
    const multiline = trim`
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
            errors: 1,
            jsx: `() => <img class="${singleLine}" />`,
            jsxOutput: `() => <img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            errors: 1,
            jsx: `() => <img class='${singleLine}' />`,
            jsxOutput: `() => <img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            errors: 1,
            jsx: `() => <img class={"${singleLine}"} />`,
            jsxOutput: `() => <img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={"${singleLine}"} />`,
            svelteOutput: `<img class={\`${multiline}\`} />`
          },
          {
            errors: 1,
            jsx: `() => <img class={'${singleLine}'} />`,
            jsxOutput: `() => <img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={'${singleLine}'} />`,
            svelteOutput: `<img class={\`${multiline}\`} />`
          }
        ],
        valid: [
          {
            jsx: `() => <img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${multiline}\`} />`
          },
          {
            angular: `<img class="${multiline}" />`,
            html: `<img class="${multiline}" />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class="${multiline}" />`
          },
          {
            angular: `<img class='${multiline}' />`,
            html: `<img class='${multiline}' />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class='${multiline}' />`
          }
        ]
      }
    );
  });

  it("should wrap long lines on to multiple lines", () => {

    const trim = createTrimTag(4);

    const singleLine = " a b c d e f g h ";
    const multiline = trim`
      a b c
      d e f
      g h
    `;

    lint(multiline, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="${singleLine}" />`,
          angularOutput: `<img class="${multiline}" />`,
          errors: 1,
          html: `<img class="${singleLine}" />`,
          htmlOutput: `<img class="${multiline}" />`,
          jsx: `() => <img class="${singleLine}" />`,
          jsxOutput: `() => <img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class="${singleLine}" />`,
          svelteOutput: `<img class="${multiline}" />`,
          vue: `<template><img class="${singleLine}" /></template>`,
          vueOutput: `<template><img class="${multiline}" /></template>`
        },
        {
          angular: `<img class='${singleLine}' />`,
          angularOutput: `<img class='${multiline}' />`,
          errors: 1,
          html: `<img class='${singleLine}' />`,
          htmlOutput: `<img class='${multiline}' />`,
          jsx: `() => <img class='${singleLine}' />`,
          jsxOutput: `() => <img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class='${singleLine}' />`,
          svelteOutput: `<img class='${multiline}' />`,
          vue: `<template><img class='${singleLine}' /></template>`,
          vueOutput: `<template><img class='${multiline}' /></template>`
        },
        {
          errors: 1,
          jsx: `() => <img class={\`${singleLine}\`} />`,
          jsxOutput: `() => <img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class={\`${singleLine}\`} />`,
          svelteOutput: `<img class={\`${multiline}\`} />`
        },
        {
          errors: 1,
          jsx: `() => <img class={"${singleLine}"} />`,
          jsxOutput: `() => <img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class={"${singleLine}"} />`,
          svelteOutput: `<img class={\`${multiline}\`} />`
        },
        {
          errors: 1,
          jsx: `() => <img class={'${singleLine}'} />`,
          jsxOutput: `() => <img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class={'${singleLine}'} />`,
          svelteOutput: `<img class={\`${multiline}\`} />`
        }
      ]
    });
  });

  it("should wrap expressions correctly", () => {

    const trim = createTrimTag(4);
    const expression = "${true ? 'true' : 'false'}";

    const singleLineWithExpressionAtBeginning = `${expression} a b c d e f g h `;
    const multilineWithExpressionAtBeginning = trim`
      ${expression}
      a b c
      d e f
      g h
    `;

    const singleLineWithExpressionInCenter = `a b c ${expression} d e f g h `;
    const multilineWithExpressionInCenter = trim`
      a b c
      ${expression}
      d e f
      g h
    `;

    const singleLineWithExpressionAtEnd = `a b c d e f g h ${expression}`;
    const multilineWithExpressionAtEnd = trim`
      a b c
      d e f
      g h
      ${expression}
    `;

    const singleLineWithClassesAroundExpression = `a b ${expression} c d e f g h `;
    const multilineWithClassesAroundExpression = trim`
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
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtBeginning}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtBeginning}\`} />`
          },
          {
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionInCenter}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionInCenter}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionInCenter}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenter}\`} />`
          },
          {
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionAtEnd}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithClassesAroundExpression}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithClassesAroundExpression}\`} />`,
            options: [{ classesPerLine: 4, indent: 2 }],
            svelte: `<img class={\`${singleLineWithClassesAroundExpression}\`} />`,
            svelteOutput: `<img class={\`${multilineWithClassesAroundExpression}\`} />`
          }
        ]
      }
    );

  });

  it("should not place expressions on a new line when the expression is not surrounded by a space", () => {

    const trim = createTrimTag(4);
    const expression = "${true ? 'true' : 'false'}";

    const singleLineWithExpressionAtBeginningWithStickyClassAtEnd = `${expression}a b c d e f g h `;
    const multilineWithExpressionAtBeginningWithStickyClassAtEnd = trim`
      ${expression}a
      b c d
      e f g
      h
    `;

    const singleLineWithExpressionInCenterWithStickyClassAtBeginning = `a b c${expression} d e f g h `;
    const multilineWithExpressionInCenterWithStickyClassAtBeginning = trim`
      a b
      c${expression}
      d e f
      g h
    `;

    const singleLineWithExpressionInCenterWithStickyClassAtEnd = `a b c ${expression}d e f g h `;
    const multilineWithExpressionInCenterWithStickyClassAtEnd = trim`
      a b c
      ${expression}d
      e f g
      h
    `;

    const singleLineWithExpressionAtEndWithStickyClassAtBeginning = `a b c d e f g h${expression}`;
    const multilineWithExpressionAtEndWithStickyClassAtBeginning = trim`
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
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`
          },
          {
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `() => <img class={\`${singleLineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            jsxOutput: `() => <img class={\`${multilineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`
          }
        ]
      }
    );

  });

  it("should not add an unnecessary new line after a sticky class", () => {

    const trim = createTrimTag(4);
    const expression = "${true ? 'true' : 'false'}";

    const multilineWithWithStickyClassAtEnd = trim`
      ${expression}a
    `;

    lint(
      multiline,
      TEST_SYNTAXES,
      {
        valid: [
          {
            jsx: `() => <img class={\`${multilineWithWithStickyClassAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${multilineWithWithStickyClassAtEnd}\`} />`
          }
        ]
      }
    );

  });

  it("should wrap string literals in variable declarations", () => {

    const trim = createTrimTag(4);

    const dirtyDefined = "const defined = 'a b c d e f g h';";
    const dirtyUndefined = "const notDefined = 'a b c d e f g h';";
    const cleanDefined = trim`const defined = \`
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
            errors: 1,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }],
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            options: [{ classesPerLine: 3, indent: 2, variables: ["defined"] }],
            svelte: `<script>${dirtyUndefined}</script>`
          }
        ]
      }
    );

  });

  it("should wrap string literals in variable declarations matched by a regex", () => {

    const trim = createTrimTag(4);

    const dirtyDefined = "const defined = 'a b c d e f g h';";
    const dirtyUndefined = "const notDefined = 'a b c d e f g h';";
    const cleanDefined = trim`const defined = \`
      a b c
      d e f
      g h
    \`;`;

    const dirtyObject = trim`const defined = {
      "matched": " a b c d e f g h ",
      "unmatched": " a b c d e f g h ",
      "nested": {
        "matched": " a b c d e f g h ",
        "unmatched": " a b c d e f g h "
      }
    };`;

    const cleanObject = trim`const defined = {
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
            errors: 1,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            options: [{
              classesPerLine: 3,
              indent: 2,
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "^\\s*[\"'`]([^\"'`]+)[\"'`]"
                ]
              ]
            }],
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`
          },
          {
            errors: 2,
            jsx: dirtyObject,
            jsxOutput: cleanObject,
            options: [{
              classesPerLine: 3,
              indent: 2,
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                ]
              ]
            }],
            svelte: `<script>${dirtyObject}</script>`,
            svelteOutput: `<script>${cleanObject}</script>`,
            vue: `<script>${dirtyObject}</script>`,
            vueOutput: `<script>${cleanObject}</script>`
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<script>${dirtyUndefined}</script>`
          }
        ]
      }
    );

  });

  it("should never wrap in an object key", () => {

    const trim = createTrimTag(4);

    const dirtyObject = trim`const obj = {
      "a b c d e f g h": "a b c d e f g h"
    };`;
    const cleanObject = trim`const obj = {
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
            errors: 1,
            jsx: dirtyObject,
            jsxOutput: cleanObject,
            options: [{
              classesPerLine: 3,
              indent: 2,
              variables: [
                ["obj", [{ match: MatcherType.ObjectKey }, { match: MatcherType.ObjectValue }]]
              ]
            }],
            svelte: `<script>${dirtyObject}</script>`,
            svelteOutput: `<script>${cleanObject}</script>`,
            vue: `<script>${dirtyObject}</script>`,
            vueOutput: `<script>${cleanObject}</script>`
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
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />`,
            jsxOutput: `() => <img class={\`${clean}\`} />`,
            options: [{ classesPerLine: 3, indent: 2, lineBreakStyle: "windows" }],
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`
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
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `() => <img class="${dirty}" />;`,
            jsxOutput: `() => <img class={\`${clean}\`} />;`,
            options: [{ classesPerLine: 3, indent: "tab" }],
            svelte: `<img class="${dirty}" />`,
            svelteOutput: `<img class="${clean}" />`,
            vue: `<template><img class="${dirty}" /></template>`,
            vueOutput: `<template><img class="${clean}" /></template>`
          }
        ]
      }
    );
  });

  // #52
  it("should wrap expressions even if `group` is set to `never`", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? 'b' : 'c'}";

    const correct = trim`
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
            options: [{ group: "never", indent: 2 }],
            svelte: `<img class={\`${correct}\`} />`
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
            errors: 1,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class={\`\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n\`} />`,
            options: [{ group: "emptyLine", indent: 2 }],
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelteOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,
            vueOutput: `<template><img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" /></template>`
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
            errors: 1,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class={\`\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n\`} />`,
            options: [{ group: "emptyLine", indent: 2 }],
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelteOutput: `<img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,
            vueOutput: `<template><img class="\n  a b c\n\n  g-1:a g-1:b\n\n  g-2:a g-2:b\n" /></template>`
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
            errors: 1,
            html: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            htmlOutput: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsx: `() => <img class={\`\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n\`} />`,
            jsxOutput: `() => <img class={\`a b c g-1:a g-1:b g-2:a g-2:b\`} />`,
            options: [{ indent: 2, preferSingleLine: true }],
            svelte: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            svelteOutput: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            vue: `<template><img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" /></template>`,
            vueOutput: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`
          },
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            angularOutput: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            errors: 1,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            htmlOutput: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsxOutput: `() => <img class={\`\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n\`} />`,
            options: [{ classesPerLine: 6, indent: 2, preferSingleLine: true, printWidth: 0 }],
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            svelteOutput: `<img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`,
            vueOutput: `<template><img class="\n  a b c\n  g-1:a g-1:b\n  g-2:a g-2:b\n" /></template>`
          }
        ],
        valid: [
          {
            angular: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            html: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            jsx: `() => <img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            options: [{ indent: 2, preferSingleLine: true }],
            svelte: `<img class="a b c g-1:a g-1:b g-2:a g-2:b" />`,
            vue: `<template><img class="a b c g-1:a g-1:b g-2:a g-2:b" /></template>`
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
            errors: 1,
            jsx: "defined` a b c d e f g h `",
            jsxOutput: "defined`\n  a b c\n  d e f\n  g h\n`",
            options: [{
              classesPerLine: 3,
              indent: 2,
              tags: ["defined"]
            }],
            svelte: "<script>defined` a b c d e f g h `</script>",
            svelteOutput: "<script>defined`\n  a b c\n  d e f\n  g h\n`</script>",
            vue: "<script>defined` a b c d e f g h `</script>",
            vueOutput: "<script>defined`\n  a b c\n  d e f\n  g h\n`</script>"
          }
        ],
        valid: [
          {
            jsx: "notDefined` a b c d e f g h `",
            options: [{
              classesPerLine: 3,
              indent: 2,
              tags: ["defined"]
            }],
            svelte: "<script>notDefined` a b c d e f g h `</script>",
            vue: "notDefined` a b c d e f g h `"
          }
        ]
      }
    );

  });

});
