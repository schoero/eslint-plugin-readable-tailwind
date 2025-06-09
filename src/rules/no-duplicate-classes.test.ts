import { describe, it } from "vitest";

import { noDuplicateClasses } from "better-tailwindcss:rules/no-duplicate-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";
import { dedent } from "better-tailwindcss:tests/utils/template.js";


describe(noDuplicateClasses.name, () => {

  it("should filter all duplicate classes", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="  b  a  c  a  " />`,
          angularOutput: `<img class="  b  a  c    " />`,
          html: `<img class="  b  a  c  a  " />`,
          htmlOutput: `<img class="  b  a  c    " />`,
          jsx: `() => <img class="  b  a  c  a  " />`,
          jsxOutput: `() => <img class="  b  a  c    " />`,
          svelte: `<img class="  b  a  c  a  " />`,
          svelteOutput: `<img class="  b  a  c    " />`,
          vue: `<template><img class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img class="  b  a  c    " /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should keep the quotes as they are", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="  b  a  b  " />`,
          angularOutput: `<img class="  b  a    " />`,
          html: `<img class="  b  a  b  " />`,
          htmlOutput: `<img class="  b  a    " />`,
          jsx: `() => <img class="  b  a  b  " />`,
          jsxOutput: `() => <img class="  b  a    " />`,
          svelte: `<img class="  b  a  b  " />`,
          svelteOutput: `<img class="  b  a    " />`,
          vue: `<template><img class="  b  a  b  " /></template>`,
          vueOutput: `<template><img class="  b  a    " /></template>`,

          errors: 1
        },
        {
          angular: `<img class='  b  a  b  ' />`,
          angularOutput: `<img class='  b  a    ' />`,
          html: `<img class='  b  a  b  ' />`,
          htmlOutput: `<img class='  b  a    ' />`,
          jsx: `() => <img class='  b  a  b  ' />`,
          jsxOutput: `() => <img class='  b  a    ' />`,
          svelte: `<img class='  b  a  b  ' />`,
          svelteOutput: `<img class='  b  a    ' />`,
          vue: `<template><img class='  b  a  b  ' /></template>`,
          vueOutput: `<template><img class='  b  a    ' /></template>`,

          errors: 1
        },
        {
          jsx: `() => <img class={\`  b  a  b  \`} />`,
          jsxOutput: `() => <img class={\`  b  a    \`} />`,
          svelte: `<img class={\`  b  a  b  \`} />`,
          svelteOutput: `<img class={\`  b  a    \`} />`,

          errors: 1
        },
        {
          jsx: `() => <img class={"  b  a  b  "} />`,
          jsxOutput: `() => <img class={"  b  a    "} />`,
          svelte: `<img class={"  b  a  b  "} />`,
          svelteOutput: `<img class={"  b  a    "} />`,

          errors: 1
        },
        {
          jsx: `() => <img class={'  b  a  b  '} />`,
          jsxOutput: `() => <img class={'  b  a    '} />`,
          svelte: `<img class={'  b  a  b  '} />`,
          svelteOutput: `<img class={'  b  a    '} />`,

          errors: 1
        }
      ]
    });
  });

  it("should remove duplicate classes in multiline strings", () => {

    const dirty = dedent`
      b
      a
      b
    `;

    const clean = dedent`
      b
      a
      
    `;

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="${dirty}" />`,
          angularOutput: `<img class="${clean}" />`,
          html: `<img class="${dirty}" />`,
          htmlOutput: `<img class="${clean}" />`,
          jsx: `() => <img class={\`${dirty}\`} />`,
          jsxOutput: `() => <img class={\`${clean}\`} />`,
          svelte: `<img class={\`${dirty}\`} />`,
          svelteOutput: `<img class={\`${clean}\`} />`,
          vue: `<template><img class="${dirty}" /></template>`,
          vueOutput: `<template><img class="${clean}" /></template>`,

          errors: 1
        }
      ]
    });

  });

  it("should remove duplicate classes around expressions in template literals", () => {

    const dirtyExpression = "${true ? 'true' : 'false'}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyWithExpressions = dedent`
      a
      b
      ${dirtyExpression}
      a
      c
    `;
    const cleanWithExpressions = dedent`
      a
      b
      ${cleanExpression}
      
      c
    `;


    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyWithExpressions}\`} />`,
          jsxOutput: `() => <img class={\`${cleanWithExpressions}\`} />`,
          svelte: `<img class={\`${dirtyWithExpressions}\`} />`,
          svelteOutput: `<img class={\`${cleanWithExpressions}\`} />`,

          errors: 1
        }
      ]
    });

  });

  it("should remove duplicate classes around template literal elements", () => {

    const dirtyExpression = "${true ? 'true' : 'false'}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyExpressionAtStart = dedent`
      a
      b
      a
      ${dirtyExpression}
    `;
    const cleanExpressionAtStart = dedent`
      a
      b
      
      ${cleanExpression}
    `;

    const dirtyExpressionBetween = dedent`
      a
      b
      a
      ${dirtyExpression}
      c
      b
      c
    `;
    const cleanExpressionBetween = dedent`
      a
      b
      
      ${cleanExpression}
      c
      
      
    `;

    const dirtyExpressionAtEnd = dedent`
      ${dirtyExpression}
      a
      b
      a
    `;
    const cleanExpressionAtEnd = dedent`
      ${cleanExpression}
      a
      b
      
    `;

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStart}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetween}\`} />`,

          errors: 3
        }
      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEnd}\`} />`,

          errors: 1
        }
      ]
    });

  });

  it("should remove duplicate classes inside template literal elements", () => {

    const dirtyExpression = "${true ? ' a b a c ' : ' b a b c '}";
    const cleanExpression = "${true ? ' a b   ' : ' b a   '}";

    const dirtyStickyExpressionAtStart = `${dirtyExpression} c `;
    const cleanStickyExpressionAtStart = `${cleanExpression} c `;

    const dirtyStickyExpressionBetween = ` c ${dirtyExpression} d `;
    const cleanStickyExpressionBetween = ` c ${cleanExpression} d `;

    const dirtyStickyExpressionAtEnd = ` c ${dirtyExpression}`;
    const cleanStickyExpressionAtEnd = ` c ${cleanExpression}`;

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStart}\`} />`,

          errors: 4
        }
      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetween}\`} />`,

          errors: 4
        }

      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEnd}\`} />`,

          errors: 4
        }
      ]
    });

  });

  it("should remove duplicate classes inside nested template literal elements", () => {

    const dirtyExpression = "${true ? ` a b ${false} a c ` : ` b a b c `}";
    const cleanExpression = "${true ? ` a b ${false}   ` : ` b a   `}";

    const dirtyStickyExpressionAtStart = `${dirtyExpression} c `;
    const cleanStickyExpressionAtStart = `${cleanExpression} c `;

    const dirtyStickyExpressionBetween = ` c ${dirtyExpression} d `;
    const cleanStickyExpressionBetween = ` c ${cleanExpression} d `;

    const dirtyStickyExpressionAtEnd = ` c ${dirtyExpression}`;
    const cleanStickyExpressionAtEnd = ` c ${cleanExpression}`;

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStart}\`} />`,

          errors: 4
        }
      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetween}\`} />`,

          errors: 4
        }

      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEnd}\`} />`,

          errors: 4
        }
      ]
    });

  });

  it("should not remove sticky duplicate classes", () => {

    const dirtyExpression = "${true ? 'true' : 'false'}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyStickyExpressionAtStart = `${dirtyExpression}a b a b`;
    const cleanStickyExpressionAtStart = `${cleanExpression}a b a `;

    const dirtyStickyExpressionBetween = `a b a b${dirtyExpression}c d c d`;
    const cleanStickyExpressionBetween = `a b  b${cleanExpression}c d c `;

    const dirtyStickyExpressionAtEnd = `a b a b${dirtyExpression}`;
    const cleanStickyExpressionAtEnd = `a b  b${cleanExpression}`;

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStart}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetween}\`} />`,

          errors: 2
        }

      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEnd}\`} />`,

          errors: 1
        }
      ]
    });

  });

  it("should remove duplicate classes in defined call signature arguments", () => {

    const dirtyDefined = "defined('  a b a  ');";
    const cleanDefined = "defined('  a b   ');";
    const dirtyUndefined = "notDefined(\"  a b a  \");";

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          svelte: `<script>${dirtyDefined}</script>`,
          svelteOutput: `<script>${cleanDefined}</script>`,
          vue: `<script>${dirtyDefined}</script>`,
          vueOutput: `<script>${cleanDefined}</script>`,

          errors: 1,
          options: [{ callees: ["defined"] }]
        }
      ],
      valid: [
        {
          jsx: dirtyUndefined,
          svelte: `<script>${dirtyUndefined}</script>`,
          vue: `<script>${dirtyUndefined}</script>`,

          options: [{ callees: ["defined"] }]
        }
      ]
    });

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          svelte: `<script>${dirtyDefined}</script>`,
          svelteOutput: `<script>${cleanDefined}</script>`,
          vue: `<script>${dirtyDefined}</script>`,
          vueOutput: `<script>${cleanDefined}</script>`,

          errors: 1,
          options: [{ callees: ["defined"] }]
        }
      ],
      valid: [
        {
          jsx: dirtyUndefined,
          svelte: `<script>${dirtyUndefined}</script>`,
          vue: `<script>${dirtyUndefined}</script>`,

          options: [{ callees: ["defined"] }]
        }
      ]
    });

  });

  it("should remove duplicate classes in string literals in call signature arguments matched by a regex", () => {

    const dirtyDefined = `defined(
      "  a b a  ",
      {
        "nested": {
          "matched": "  a b a  ",
        },
        "deeply": {
          "nested": {
            "unmatched": "  a b a  ",
            "matched": "  a b a  "
          },
        },
        "multiline": {
          "matched": \`
            a  b
            a  c
          \`
        }
      }
    );`;

    const cleanDefined = `defined(
      "  a b   ",
      {
        "nested": {
          "matched": "  a b   ",
        },
        "deeply": {
          "nested": {
            "unmatched": "  a b a  ",
            "matched": "  a b   "
          },
        },
        "multiline": {
          "matched": \`
            a  b
              c
          \`
        }
      }
    );`;

    lint(
      noDuplicateClasses,
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
              ]
            }]
          }
        ]
      }
    );

  });

  it("should remove duplicate classes in string literals in defined variable declarations", () => {

    const dirtyDefined = "const defined = \"  a b a  \";";
    const cleanDefined = "const defined = \"  a b   \";";
    const dirtyUndefined = "const notDefined = \"  a b a  \";";

    const dirtyMultiline = `const defined = \`
      a  b
      a  c
    \`;`;

    const cleanMultiline = `const defined = \`
      a  b
        c
    \`;`;

    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          svelte: `<script>${dirtyDefined}</script>`,
          svelteOutput: `<script>${cleanDefined}</script>`,
          vue: `<script>${dirtyDefined}</script>`,
          vueOutput: `<script>${cleanDefined}</script>`,

          errors: 1,
          options: [{ variables: ["defined"] }]
        },
        {
          jsx: dirtyMultiline,
          jsxOutput: cleanMultiline,
          svelte: `<script>${dirtyMultiline}</script>`,
          svelteOutput: `<script>${cleanMultiline}</script>`,
          vue: `<script>${dirtyMultiline}</script>`,
          vueOutput: `<script>${cleanMultiline}</script>`,

          errors: 1,
          options: [{ variables: ["defined"] }]
        }
      ],
      valid: [
        {
          jsx: dirtyUndefined,
          svelte: `<script>${dirtyUndefined}</script>`,
          vue: `<script>${dirtyUndefined}</script>`
        }
      ]
    });

  });

  it("should remove duplicate classes in string literals in defined tagged template literals", () => {
    lint(
      noDuplicateClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            jsx: "defined` a b a `",
            jsxOutput: "defined` a b  `",
            svelte: "<script>defined` a b a `</script>",
            svelteOutput: "<script>defined` a b  `</script>",
            vue: "defined` a b a `",
            vueOutput: "defined` a b  `",

            errors: 1,
            options: [{ tags: ["defined"] }]
          }
        ],
        valid: [
          {
            jsx: "notDefined` a b a `",
            svelte: "<script>notDefined` a b a `</script>",
            vue: "notDefined` a b a `",

            options: [{ tags: ["defined"] }]
          }
        ]
      }
    );
  });

  // #81
  it("should not report duplicates for carriage return characters", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      valid: [
        {
          html: `<img class="  b  a \r\n c  \r\n  d  " />`,
          jsx: `() => <img class="  b  a \r\n c  \r\n  d  " />`,
          svelte: `<img class="  b  a \r\n c  \r\n  d  " />`,
          vue: `<template><img class="  b  a \r\n c  \r\n  d  " /></template>`
        }
      ]
    });
  });

  it("should not report duplicates for newline characters", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      valid: [
        {
          html: `<img class="  b  a \n c  \n  d  " />`,
          jsx: `() => <img class="  b  a \n c  \n  d  " />`,
          svelte: `<img class="  b  a \n c  \n  d  " />`,
          vue: `<template><img class="  b  a \n c  \n  d  " /></template>`
        }
      ]
    });
  });

  it("should report fixes with unchanged line endings", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img class="  b  a \r\n c  \r\n a d  " />`,
          htmlOutput: `<img class="  b  a \r\n c  \r\n  d  " />`,
          jsx: `() => <img class="  b  a \r\n c  \r\n a d  " />`,
          jsxOutput: `() => <img class="  b  a \r\n c  \r\n  d  " />`,
          svelte: `<img class="  b  a \r\n c  \r\n a d  " />`,
          svelteOutput: `<img class="  b  a \r\n c  \r\n  d  " />`,
          vue: `<template><img class="  b  a \r\n c  \r\n a d  " /></template>`,
          vueOutput: `<template><img class="  b  a \r\n c  \r\n  d  " /></template>`,

          errors: 1
        }
      ]
    });
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img class="  b  a \n c  \n a d  " />`,
          htmlOutput: `<img class="  b  a \n c  \n  d  " />`,
          jsx: `() => <img class="  b  a \n c  \n a d  " />`,
          jsxOutput: `() => <img class="  b  a \n c  \n  d  " />`,
          svelte: `<img class="  b  a \n c  \n a d  " />`,
          svelteOutput: `<img class="  b  a \n c  \n  d  " />`,
          vue: `<template><img class="  b  a \n c  \n a d  " /></template>`,
          vueOutput: `<template><img class="  b  a \n c  \n  d  " /></template>`,

          errors: 1
        }
      ]
    });
  });


});
