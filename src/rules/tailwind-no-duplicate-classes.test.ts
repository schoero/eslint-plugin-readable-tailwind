import { describe, it } from "vitest";

import { tailwindNoDuplicateClasses } from "readable-tailwind:rules:tailwind-no-duplicate-classes.js";
import { createTrimTag, lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe(tailwindNoDuplicateClasses.name, () => {

  it("should filter all duplicate classes", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="  b  a  c  a  " />`,
          angularOutput: `<img class="  b  a  c    " />`,
          errors: 1,
          html: `<img class="  b  a  c  a  " />`,
          htmlOutput: `<img class="  b  a  c    " />`,
          jsx: `() => <img class="  b  a  c  a  " />`,
          jsxOutput: `() => <img class="  b  a  c    " />`,
          svelte: `<img class="  b  a  c  a  " />`,
          svelteOutput: `<img class="  b  a  c    " />`,
          vue: `<template><img class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img class="  b  a  c    " /></template>`
        }
      ]
    });
  });

  it("should keep the quotes as they are", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="  b  a  b  " />`,
          angularOutput: `<img class="  b  a    " />`,
          errors: 1,
          html: `<img class="  b  a  b  " />`,
          htmlOutput: `<img class="  b  a    " />`,
          jsx: `() => <img class="  b  a  b  " />`,
          jsxOutput: `() => <img class="  b  a    " />`,
          svelte: `<img class="  b  a  b  " />`,
          svelteOutput: `<img class="  b  a    " />`,
          vue: `<template><img class="  b  a  b  " /></template>`,
          vueOutput: `<template><img class="  b  a    " /></template>`
        },
        {
          angular: `<img class='  b  a  b  ' />`,
          angularOutput: `<img class='  b  a    ' />`,
          errors: 1,
          html: `<img class='  b  a  b  ' />`,
          htmlOutput: `<img class='  b  a    ' />`,
          jsx: `() => <img class='  b  a  b  ' />`,
          jsxOutput: `() => <img class='  b  a    ' />`,
          svelte: `<img class='  b  a  b  ' />`,
          svelteOutput: `<img class='  b  a    ' />`,
          vue: `<template><img class='  b  a  b  ' /></template>`,
          vueOutput: `<template><img class='  b  a    ' /></template>`
        },
        {
          errors: 1,
          jsx: `() => <img class={\`  b  a  b  \`} />`,
          jsxOutput: `() => <img class={\`  b  a    \`} />`,
          svelte: `<img class={\`  b  a  b  \`} />`,
          svelteOutput: `<img class={\`  b  a    \`} />`
        },
        {
          errors: 1,
          jsx: `() => <img class={"  b  a  b  "} />`,
          jsxOutput: `() => <img class={"  b  a    "} />`,
          svelte: `<img class={"  b  a  b  "} />`,
          svelteOutput: `<img class={"  b  a    "} />`
        },
        {
          errors: 1,
          jsx: `() => <img class={'  b  a  b  '} />`,
          jsxOutput: `() => <img class={'  b  a    '} />`,
          svelte: `<img class={'  b  a  b  '} />`,
          svelteOutput: `<img class={'  b  a    '} />`
        }
      ]
    });
  });

  it("should remove duplicate classes in multiline strings", () => {

    const trim = createTrimTag(4);

    const dirty = trim`
      b
      a
      b
    `;

    const clean = trim`
      b
      a
      
    `;

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="${dirty}" />`,
          angularOutput: `<img class="${clean}" />`,
          errors: 1,
          html: `<img class="${dirty}" />`,
          htmlOutput: `<img class="${clean}" />`,
          jsx: `() => <img class={\`${dirty}\`} />`,
          jsxOutput: `() => <img class={\`${clean}\`} />`,
          svelte: `<img class={\`${dirty}\`} />`,
          svelteOutput: `<img class={\`${clean}\`} />`,
          vue: `<template><img class="${dirty}" /></template>`,
          vueOutput: `<template><img class="${clean}" /></template>`
        }
      ]
    });

  });

  it("should remove duplicate classes around expressions in template literals", () => {

    const trim = createTrimTag(4);

    const dirtyExpression = "${true ? 'true' : 'false'}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyWithExpressions = trim`
      a
      b
      ${dirtyExpression}
      a
      c
    `;
    const cleanWithExpressions = trim`
      a
      b
      ${cleanExpression}
      
      c
    `;


    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `() => <img class={\`${dirtyWithExpressions}\`} />`,
          jsxOutput: `() => <img class={\`${cleanWithExpressions}\`} />`,
          svelte: `<img class={\`${dirtyWithExpressions}\`} />`,
          svelteOutput: `<img class={\`${cleanWithExpressions}\`} />`
        }
      ]
    });

  });

  it("should remove duplicate classes around template literal elements", () => {

    const trim = createTrimTag(4);

    const dirtyExpression = "${true ? 'true' : 'false'}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyExpressionAtStart = trim`
      a
      b
      a
      ${dirtyExpression}
    `;
    const cleanExpressionAtStart = trim`
      a
      b
      
      ${cleanExpression}
    `;

    const dirtyExpressionBetween = trim`
      a
      b
      a
      ${dirtyExpression}
      c
      b
      c
    `;
    const cleanExpressionBetween = trim`
      a
      b
      
      ${cleanExpression}
      c
      
      
    `;

    const dirtyExpressionAtEnd = trim`
      ${dirtyExpression}
      a
      b
      a
    `;
    const cleanExpressionAtEnd = trim`
      ${cleanExpression}
      a
      b
      
    `;

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `() => <img class={\`${dirtyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStart}\`} />`
        }
      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetween}\`} />`
        }
      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `() => <img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEnd}\`} />`
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

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStart}\`} />`
        }
      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetween}\`} />`
        }

      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEnd}\`} />`
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

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStart}\`} />`
        }
      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetween}\`} />`
        }

      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEnd}\`} />`
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

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStart}\`} />`
        }
      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetween}\`} />`
        }

      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEnd}\`} />`
        }
      ]
    });

  });

  it("should remove duplicate classes in defined call signature arguments", () => {

    const dirtyDefined = "defined('  a b a  ');";
    const cleanDefined = "defined('  a b   ');";
    const dirtyUndefined = "notDefined(\"  a b a  \");";

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          options: [{ callees: ["defined"] }],
          svelte: `<script>${dirtyDefined}</script>`,
          svelteOutput: `<script>${cleanDefined}</script>`,
          vue: `<script>${dirtyDefined}</script>`,
          vueOutput: `<script>${cleanDefined}</script>`
        }
      ],
      valid: [
        {
          jsx: dirtyUndefined,
          options: [{ callees: ["defined"] }],
          svelte: `<script>${dirtyUndefined}</script>`,
          vue: `<script>${dirtyUndefined}</script>`
        }
      ]
    });

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          options: [{ callees: ["defined"] }],
          svelte: `<script>${dirtyDefined}</script>`,
          svelteOutput: `<script>${cleanDefined}</script>`,
          vue: `<script>${dirtyDefined}</script>`,
          vueOutput: `<script>${cleanDefined}</script>`
        }
      ],
      valid: [
        {
          jsx: dirtyUndefined,
          options: [{ callees: ["defined"] }],
          svelte: `<script>${dirtyUndefined}</script>`,
          vue: `<script>${dirtyUndefined}</script>`
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
      tailwindNoDuplicateClasses,
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
              ]
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

    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          options: [{ variables: ["defined"] }],
          svelte: `<script>${dirtyDefined}</script>`,
          svelteOutput: `<script>${cleanDefined}</script>`,
          vue: `<script>${dirtyDefined}</script>`,
          vueOutput: `<script>${cleanDefined}</script>`
        },
        {
          errors: 1,
          jsx: dirtyMultiline,
          jsxOutput: cleanMultiline,
          options: [{ variables: ["defined"] }],
          svelte: `<script>${dirtyMultiline}</script>`,
          svelteOutput: `<script>${cleanMultiline}</script>`,
          vue: `<script>${dirtyMultiline}</script>`,
          vueOutput: `<script>${cleanMultiline}</script>`
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
      tailwindNoDuplicateClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: "defined` a b a `",
            jsxOutput: "defined` a b  `",
            options: [{ tags: ["defined"] }],
            svelte: "<script>defined` a b a `</script>",
            svelteOutput: "<script>defined` a b  `</script>",
            vue: "defined` a b a `",
            vueOutput: "defined` a b  `"
          }
        ],
        valid: [
          {
            jsx: "notDefined` a b a `",
            options: [{ tags: ["defined"] }],
            svelte: "<script>notDefined` a b a `</script>",
            vue: "notDefined` a b a `"
          }
        ]
      }
    );
  });

  // #81
  it("should not report duplicates for carriage return characters", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
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
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
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
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="  b  a \r\n c  \r\n a d  " />`,
          htmlOutput: `<img class="  b  a \r\n c  \r\n  d  " />`,
          jsx: `() => <img class="  b  a \r\n c  \r\n a d  " />`,
          jsxOutput: `() => <img class="  b  a \r\n c  \r\n  d  " />`,
          svelte: `<img class="  b  a \r\n c  \r\n a d  " />`,
          svelteOutput: `<img class="  b  a \r\n c  \r\n  d  " />`,
          vue: `<template><img class="  b  a \r\n c  \r\n a d  " /></template>`,
          vueOutput: `<template><img class="  b  a \r\n c  \r\n  d  " /></template>`
        }
      ]
    });
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="  b  a \n c  \n a d  " />`,
          htmlOutput: `<img class="  b  a \n c  \n  d  " />`,
          jsx: `() => <img class="  b  a \n c  \n a d  " />`,
          jsxOutput: `() => <img class="  b  a \n c  \n  d  " />`,
          svelte: `<img class="  b  a \n c  \n a d  " />`,
          svelteOutput: `<img class="  b  a \n c  \n  d  " />`,
          vue: `<template><img class="  b  a \n c  \n a d  " /></template>`,
          vueOutput: `<template><img class="  b  a \n c  \n  d  " /></template>`
        }
      ]
    });
  });


});
