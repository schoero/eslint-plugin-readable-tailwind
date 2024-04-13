import { createTrimTag } from "tests/utils";
import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "vitest";

import { tailwindMultiline } from "readable-tailwind:rules:tailwind-multiline.js";


describe(tailwindMultiline.name, () => {

  it("should not wrap empty strings", () => {
    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        valid: [
          {
            html: `<img class="" />`,
            jsx: `<img class="" />`,
            svelte: `<img class="" />`,
            vue: `<template><img class="" /></template>`
          },
          {
            html: `<img class='' />`,
            jsx: `<img class='' />`,
            svelte: `<img class='' />`,
            vue: `<template><img class='' /></template>`
          },
          {
            jsx: `<img class={""} />`,
            svelte: `<img class={""} />`
          },
          {
            jsx: `<img class={''} />`,
            svelte: `<img class={''} />`
          },
          {
            jsx: `<img class={\`\`} />`,
            svelte: `<img class={\`\`} />`
          }
        ]
      }
    );
  });

  it("should not wrap short lines", () => {
    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        valid: [
          {
            html: `<img class="a b c" />`,
            jsx: `<img class="a b c" />`,
            svelte: `<img class="a b c" />`,
            vue: `<template><img class="a b c" /></template>`
          },
          {
            html: `<img class='a b c' />`,
            jsx: `<img class='a b c' />`,
            svelte: `<img class='a b c' />`,
            vue: `<template><img class='a b c' /></template>`
          },
          {
            jsx: `<img class={"a b c"} />`,
            svelte: `<img class={"a b c"} />`
          },
          {
            jsx: `<img class={'a b c'} />`,
            svelte: `<img class={'a b c'} />`
          },
          {
            jsx: `<img class={\`a b c\`} />`,
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
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `<img class={\`${dirty}\`} />`,
            jsxOutput: `<img class={\`${clean}\`} />`,
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

  it("should wrap and not collapse short lines containing expressions", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? ' true ' : ' false '}";

    const incorrect = trim`
      a ${expression}
    `;

    const correct = trim`
      a
      ${expression}
    `;

    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: `<img class={\`${incorrect}\`} />`,
            jsxOutput: `<img class={\`${correct}\`} />`,
            options: [{ classesPerLine: 3, group: "newLine", indent: 2 }],
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
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `<img class="${dirty}" />`,
            jsxOutput: `<img class={\`${clean}\`} />`,
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

  it("should disable the `printWidth` limit when set to `0`", () => {
    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        valid: [
          {
            html: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            jsx: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            options: [{ printWidth: 0 }],
            svelte: `<img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" />`,
            vue: `<template><img class="this string literal is longer than 80 characters and would be wrapped using the default printWidth" /></template>`
          }
        ]
      }
    );
  });

  it("should change the quotes in defined call signatures to template literals", () => {

    const trim = createTrimTag(4);

    const dirtyDefined = "defined('a b c d e f g h')";

    const cleanDefined = trim`defined(\`
      a b c
      d e f
      g h
    \`)`;

    const dirtyUndefined = "notDefined('a b c d e f g h')";

    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: `<img class={${dirtyDefined}} />`,
            jsxOutput: `<img class={${cleanDefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyDefined}} />`,
            svelteOutput: `<img class={${cleanDefined}} />`
          }
        ],
        valid: [
          {
            jsx: `<img class={${dirtyUndefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyUndefined}} />`
          }
        ]
      }
    );

    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: `<img class={${dirtyDefined}} />`,
            jsxOutput: `<img class={${cleanDefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyDefined}} />`,
            svelteOutput: `<img class={${cleanDefined}} />`
          }
        ],
        valid: [
          {
            jsx: `<img class={${dirtyUndefined}} />`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<img class={${dirtyUndefined}} />`
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
      tailwindMultiline,
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
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: `<img class="${singleLine}" />`,
            jsxOutput: `<img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            errors: 1,
            jsx: `<img class='${singleLine}' />`,
            jsxOutput: `<img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            errors: 1,
            jsx: `<img class={"${singleLine}"} />`,
            jsxOutput: `<img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={"${singleLine}"} />`,
            svelteOutput: `<img class={\`${multiline}\`} />`
          },
          {
            errors: 1,
            jsx: `<img class={'${singleLine}'} />`,
            jsxOutput: `<img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={'${singleLine}'} />`,
            svelteOutput: `<img class={\`${multiline}\`} />`
          }
        ],
        valid: [
          {
            jsx: `<img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${multiline}\`} />`
          },
          {
            html: `<img class="${multiline}" />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class="${multiline}" />`
          },
          {
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

    lint(tailwindMultiline, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="${singleLine}" />`,
          htmlOutput: `<img class="${multiline}" />`,
          jsx: `<img class="${singleLine}" />`,
          jsxOutput: `<img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class="${singleLine}" />`,
          svelteOutput: `<img class="${multiline}" />`,
          vue: `<template><img class="${singleLine}" /></template>`,
          vueOutput: `<template><img class="${multiline}" /></template>`
        },
        {
          errors: 1,
          html: `<img class='${singleLine}' />`,
          htmlOutput: `<img class='${multiline}' />`,
          jsx: `<img class='${singleLine}' />`,
          jsxOutput: `<img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class='${singleLine}' />`,
          svelteOutput: `<img class='${multiline}' />`,
          vue: `<template><img class='${singleLine}' /></template>`,
          vueOutput: `<template><img class='${multiline}' /></template>`
        },
        {
          errors: 1,
          jsx: `<img class={\`${singleLine}\`} />`,
          jsxOutput: `<img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class={\`${singleLine}\`} />`,
          svelteOutput: `<img class={\`${multiline}\`} />`
        },
        {
          errors: 1,
          jsx: `<img class={"${singleLine}"} />`,
          jsxOutput: `<img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class={"${singleLine}"} />`,
          svelteOutput: `<img class={\`${multiline}\`} />`
        },
        {
          errors: 1,
          jsx: `<img class={'${singleLine}'} />`,
          jsxOutput: `<img class={\`${multiline}\`} />`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<img class={'${singleLine}'} />`,
          svelteOutput: `<img class={\`${multiline}\`} />`
        }
      ]
    });
  });

  it("should wrap expressions correctly", () => {

    const trim = createTrimTag(4);
    const expression = "${true ? ' true ' : ' false '}";

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
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionAtBeginning}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtBeginning}\`} />`
          },
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionInCenter}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionInCenter}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionInCenter}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenter}\`} />`
          },
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionAtEnd}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithClassesAroundExpression}\`} />`,
            jsxOutput: `<img class={\`${multilineWithClassesAroundExpression}\`} />`,
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
    const expression = "${true ? ' true ' : ' false '}";

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
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtBeginningWithStickyClassAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtBeginning}\`} />`
          },
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionInCenterWithStickyClassAtEnd}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionInCenterWithStickyClassAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `<img class={\`${singleLineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            jsxOutput: `<img class={\`${multilineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class={\`${singleLineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`,
            svelteOutput: `<img class={\`${multilineWithExpressionAtEndWithStickyClassAtBeginning}\`} />`
          }
        ]
      }
    );

  });


  it("should group correctly", () => {

    const trim = createTrimTag(4);

    const singleLine = "g-1:a g-1:b g-2:a g-2:b g-3:a g-3:b";
    const multiline = trim`
      g-1:a g-1:b

      g-2:a g-2:b

      g-3:a g-3:b
    `;

    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<img class="${singleLine}" />`,
            htmlOutput: `<img class="${multiline}" />`,
            jsx: `<img class={\`${singleLine}\`} />`,
            jsxOutput: `<img class={\`${multiline}\`} />`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<img class="${singleLine}" />`,
            svelteOutput: `<img class="${multiline}" />`,
            vue: `<template><img class="${singleLine}" /></template>`,
            vueOutput: `<template><img class="${multiline}" /></template>`
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
      tailwindMultiline,
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
      tailwindMultiline,
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

  it("should be possible to change the lineBreakStyle to windows", () => {

    const dirty = " a b c d e f g h ";
    const clean = "\r\n  a b c\r\n  d e f\r\n  g h\r\n";

    lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `<img class="${dirty}" />`,
            jsxOutput: `<img class={\`${clean}\`} />`,
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
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<img class="${dirty}" />`,
            htmlOutput: `<img class="${clean}" />`,
            jsx: `const Test = () => <img class="${dirty}" />;`,
            jsxOutput: `const Test = () => <img class={\`${clean}\`} />;`,
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

});
