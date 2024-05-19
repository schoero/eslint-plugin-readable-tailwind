import { createTrimTag, lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe(tailwindNoUnnecessaryWhitespace.name, () => {

  it("should trim leading and trailing white space in literals", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="  b  a  " />`,
          htmlOutput: `<img class="b a" />`,
          jsx: `() => <img class="  b  a  " />`,
          jsxOutput: `() => <img class="b a" />`,
          svelte: `<img class="  b  a  " />`,
          svelteOutput: `<img class="b a" />`,
          vue: `<template><img class="  b  a  " /></template>`,
          vueOutput: `<template><img class="b a" /></template>`
        }
      ]
    });
  });

  it("should collapse empty multiline strings", () => {
    const dirtyEmptyMultilineString = `

    `;
    const cleanEmptyMultilineString = "";

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="${dirtyEmptyMultilineString}" />`,
          htmlOutput: `<img class="${cleanEmptyMultilineString}" />`,
          jsx: `() => <img class="${dirtyEmptyMultilineString}" />`,
          jsxOutput: `() => <img class="${cleanEmptyMultilineString}" />`,
          svelte: `<img class="${dirtyEmptyMultilineString}" />`,
          svelteOutput: `<img class="${cleanEmptyMultilineString}" />`,
          vue: `<template><img class="${dirtyEmptyMultilineString}" /></template>`,
          vueOutput: `<template><img class="${cleanEmptyMultilineString}" /></template>`
        }
      ]
    });
  });

  it("should keep the quotes as they are", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="  b  a  " />`,
          htmlOutput: `<img class="b a" />`,
          jsx: `() => <img class="  b  a  " />`,
          jsxOutput: `() => <img class="b a" />`,
          svelte: `<img class="  b  a  " />`,
          svelteOutput: `<img class="b a" />`,
          vue: `<template><img class="  b  a  " /></template>`,
          vueOutput: `<template><img class="b a" /></template>`
        },
        {
          errors: 1,
          html: `<img class='  b  a  ' />`,
          htmlOutput: `<img class='b a' />`,
          jsx: `() => <img class='  b  a  ' />`,
          jsxOutput: `() => <img class='b a' />`,
          svelte: `<img class='  b  a  ' />`,
          svelteOutput: `<img class='b a' />`,
          vue: `<template><img class='  b  a  ' /></template>`,
          vueOutput: `<template><img class='b a' /></template>`
        },
        {
          errors: 1,
          jsx: `() => <img class={\`  b  a  \`} />`,
          jsxOutput: `() => <img class={\`b a\`} />`,
          svelte: `<img class={\`  b  a  \`} />`,
          svelteOutput: `<img class={\`b a\`} />`
        },
        {
          errors: 1,
          jsx: `() => <img class={"  b  a  "} />`,
          jsxOutput: `() => <img class={"b a"} />`,
          svelte: `<img class={"  b  a  "} />`,
          svelteOutput: `<img class={"b a"} />`
        },
        {
          errors: 1,
          jsx: `() => <img class={'  b  a  '} />`,
          jsxOutput: `() => <img class={'b a'} />`,
          svelte: `<img class={'  b  a  '} />`,
          svelteOutput: `<img class={'b a'} />`
        }
      ]
    });
  });

  it("should keep one whitespace around template elements", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix template literal.
        {
          errors: 3,
          jsx: `() => <img class={\`  b  a  \${"  c  "}  d  \`} />`,
          jsxOutput: `() => <img class={\`b a \${"  c  "} d\`} />`,
          svelte: `<img class={\`  b  a  \${"  c  "}  d  \`} />`,
          svelteOutput: `<img class={\`b a \${"  c  "} d\`} />`
        },
        // 2nd pass: fix inner template element.
        {
          errors: 1,
          jsx: `() => <img class={\`b a \${"  c  "} d\`} />`,
          jsxOutput: `() => <img class={\`b a \${"c"} d\`} />`,
          svelte: `<img class={\`b a \${"  c  "} d\`} />`,
          svelteOutput: `<img class={\`b a \${"c"} d\`} />`
        }
      ]
    });
  });

  it("should keep no whitespace at the end of the line in multiline strings", () => {

    const trim = createTrimTag(4);

    const dirty = trim`
      a      
      b  
      c    
    `;

    const clean = trim`
      a
      b
      c
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
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

  it("should remove unnecessary whitespace inside and around multiline template literal elements", () => {

    const trim = createTrimTag(4);

    const dirtyExpression = "${true ? '  true  ' : '  false  '}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyExpressionAtStart = trim`
      ${dirtyExpression}  
      a  
    `;
    const cleanExpressionAtStartPass1 = trim`
      ${cleanExpression}  
      a  
    `;
    const cleanExpressionAtStartPass2 = trim`
      ${cleanExpression}
      a
    `;

    const dirtyExpressionBetween = trim`
      a  
      ${dirtyExpression}  
      b  
    `;
    const cleanExpressionBetweenPass1 = trim`
      a
      ${cleanExpression}  
      b  
    `;
    const cleanExpressionBetweenPass2 = trim`
      a
      ${cleanExpression}
      b
    `;

    const dirtyExpressionAtEnd = trim`
      a  
      ${dirtyExpression}  
    `;
    const cleanExpressionAtEndPass1 = trim`
      a
      ${cleanExpression}  
    `;
    const cleanExpressionAtEndPass2 = trim`
      a
      ${cleanExpression}
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix template literal.
        {
          errors: 3,
          jsx: `() => <img class={\`${dirtyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass1}\`} />`
        },
        // 2nd pass: fix expression.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass2}\`} />`
        }
      ]
    });

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass2}\`} />`
        }
      ]
    });

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass2}\`} />`
        }
      ]
    });

  });

  it("should remove unnecessary whitespace inside and around single line template literal elements", () => {

    const dirtyExpression = "${true ? ' true ' : ' false '}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyExpressionAtStartAtStart = `  ${dirtyExpression}  a  `;
    const cleanExpressionAtStartPass1 = `${cleanExpression}  a  `;
    const cleanExpressionAtStartPass2 = `${cleanExpression} a`;

    const dirtyExpressionBetween = `  a  ${dirtyExpression}  b  `;
    const cleanExpressionBetweenPass1 = `a ${cleanExpression}  b  `;
    const cleanExpressionBetweenPass2 = `a ${cleanExpression} b`;

    const dirtyExpressionAtEnd = `  a  ${dirtyExpression}  `;
    const cleanExpressionAtEndPass1 = `a ${cleanExpression}  `;
    const cleanExpressionAtEndPass2 = `a ${cleanExpression}`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyExpressionAtStartAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStartAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass2}\`} />`
        }
      ]
    });

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass2}\`} />`
        }
      ]
    });

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass2}\`} />`
        }
      ]
    });

  });

  it("should not create a whitespace around sticky template literal elements", () => {

    const dirtyExpression = "${true ? ' true ' : ' false '}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyStickyExpressionAtStart = `  ${dirtyExpression}a  b  `;
    const cleanStickyExpressionAtStartPass1 = `${cleanExpression}a  b  `;
    const cleanStickyExpressionAtStartPass2 = `${cleanExpression}a b`;

    const dirtyStickyExpressionBetween = `  a  b${dirtyExpression}c  d  `;
    const cleanStickyExpressionBetweenPass1 = `a b${cleanExpression}c  d  `;
    const cleanStickyExpressionBetweenPass2 = `a b${cleanExpression}c d`;

    const dirtyStickyExpressionAtEnd = `  a${dirtyExpression}  `;
    const cleanStickyExpressionAtEndPass1 = `a${cleanExpression}  `;
    const cleanStickyExpressionAtEndPass2 = `a${cleanExpression}`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStartPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStartPass2}\`} />`,
          svelte: `<img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStartPass2}\`} />`
        }
      ]
    });

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetweenPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetweenPass2}\`} />`,
          svelte: `<img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetweenPass2}\`} />`
        }
      ]
    });

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          errors: 4,
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEndPass1}\`} />`
        },
        // 2nd pass: fix trailing template element.
        {
          errors: 1,
          jsx: `() => <img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEndPass2}\`} />`,
          svelte: `<img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEndPass2}\`} />`
        }
      ]
    });

  });

  it("should remove newlines whenever possible", () => {
    const uncleanedMultilineString = `
      d  c
      b  a
    `;

    const cleanedMultilineString = `
      d c
      b a
    `;

    const cleanedSinglelineString = "d c b a";

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img class="${uncleanedMultilineString}" />`,
          htmlOutput: `<img class="${cleanedMultilineString}" />`,
          svelte: `<img class="${uncleanedMultilineString}" />`,
          svelteOutput: `<img class="${cleanedMultilineString}" />`,
          vue: `<template><img class="${uncleanedMultilineString}" /></template>`,
          vueOutput: `<template><img class="${cleanedMultilineString}" /></template>`
        },
        {
          errors: 1,
          html: `<img class='${uncleanedMultilineString}' />`,
          htmlOutput: `<img class='${cleanedMultilineString}' />`,
          svelte: `<img class='${uncleanedMultilineString}' />`,
          svelteOutput: `<img class='${cleanedMultilineString}' />`,
          vue: `<template><img class='${uncleanedMultilineString}' /></template>`,
          vueOutput: `<template><img class='${cleanedMultilineString}' /></template>`
        },
        {
          errors: 1,
          jsx: `() => <img class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `() => <img class={\`${cleanedMultilineString}\`} />`,
          svelte: `<img class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<img class={\`${cleanedMultilineString}\`} />`
        },
        {
          errors: 1,
          html: `<img class='${uncleanedMultilineString}' />`,
          htmlOutput: `<img class='${cleanedSinglelineString}' />`,
          jsx: `() => <img class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `() => <img class={\`${cleanedSinglelineString}\`} />`,
          options: [{ allowMultiline: false }],
          svelte: `<img class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<img class={\`${cleanedSinglelineString}\`} />`,
          vue: `<template><img class='${uncleanedMultilineString}' /></template>`,
          vueOutput: `<template><img class='${cleanedSinglelineString}' /></template>`
        }
      ],
      valid: [
        {
          html: `<img class="${cleanedMultilineString}" />`,
          jsx: `() => <img class={\`${cleanedMultilineString}\`} />`,
          svelte: `<img class="${cleanedMultilineString}" />`,
          vue: `<template><img class="${cleanedMultilineString}" /></template>`
        },
        {
          html: `<img class="${cleanedSinglelineString}" />`,
          jsx: `() => <img class="${cleanedSinglelineString}" />`,
          svelte: `<img class="${cleanedSinglelineString}" />`,
          vue: `<template><img class="${cleanedSinglelineString}" /></template>`
        }
      ]
    });
  });

  it("should remove unnecessary whitespace in defined call signature arguments", () => {

    const dirtyDefined = "defined('  f  e  ');";
    const cleanDefined = "defined('f e');";
    const dirtyUndefined = "notDefined(\"  f  e  \");";

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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

  it("should remove unnecessary whitespace in string literals in call signature arguments matched by a regex", () => {

    const dirtyDefined = `defined(
      "  b  a  ",
      {
        "nested": {
          "matched": "  b  a  ",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "  b  a  "
          },
        },
        "multiline": {
          "matched": \`
            d  a
            b  c
          \`
        }
      }
    );`;

    const cleanDefined = `defined(
      "b a",
      {
        "nested": {
          "matched": "b a",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "b a"
          },
        },
        "multiline": {
          "matched": \`
            d a
            b c
          \`
        }
      }
    );`;

    lint(
      tailwindNoUnnecessaryWhitespace,
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

  it("should also work in defined call signature arguments in template literals", () => {

    const dirtyDefined = "${defined('  f  e  ')}";
    const cleanDefined = "${defined('f e')}";
    const dirtyUndefined = "${notDefined('  f  e  ')}";

    const dirtyDefinedMultiline = `
      b a
      d c ${dirtyDefined} h g
      j i
    `;

    const cleanDefinedMultiline = `
      b a
      d c ${cleanDefined} h g
      j i
    `;

    const dirtyUndefinedMultiline = `
      b a
      d c ${dirtyUndefined} h g
      j i
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `() => <img class={\`${dirtyDefinedMultiline}\`} />`,
          jsxOutput: `() => <img class={\`${cleanDefinedMultiline}\`} />`,
          options: [{ callees: ["defined"] }],
          svelte: `<img class={\`${dirtyDefinedMultiline}\`} />`,
          svelteOutput: `<img class={\`${cleanDefinedMultiline}\`} />`
        }
      ],
      valid: [
        {
          jsx: `() => <img class={\`${dirtyUndefinedMultiline}\`} />`,
          svelte: `<img class={\`${dirtyUndefinedMultiline}\`} />`
        }
      ]
    });

  });

  it("should remove unnecessary whitespace in string literals in defined variable declarations", () => {

    const dirtyDefined = "const defined = \"  b  a  \";";
    const cleanDefined = "const defined = \"b a\";";
    const dirtyUndefined = "const notDefined = \"  b  a  \";";

    const dirtyMultiline = `const defined = \`
      b  a
      d  c
    \`;`;

    const cleanMultiline = `const defined = \`
      b a
      d c
    \`;`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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

  it("should remove unnecessary whitespace in string literals in defined variable declarations matched by a regex", () => {

    const dirtyDefined = "const defined = \"  b   a  \";";
    const cleanDefined = "const defined = \"b a\";";
    const dirtyUndefined = "const notDefined = \"  b  a  \";";

    const dirtyObject = `const defined = {
      "matched": "  b  a  ",
      "unmatched": "  b  a  ",
      "nested": {
        "matched": "  b  a  ",
        "unmatched": "  b  a  "
      }
    };`;

    const cleanObject = `const defined = {
      "matched": "b a",
      "unmatched": "  b  a  ",
      "nested": {
        "matched": "b a",
        "unmatched": "  b  a  "
      }
    };`;

    const dirtyMultiline = `const defined = \`
      b  a
      d  c
    \`;`;

    const cleanMultiline = `const defined = \`
      b a
      d c
    \`;`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirtyDefined,
          jsxOutput: cleanDefined,
          options: [{
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
        },
        {
          errors: 1,
          jsx: dirtyMultiline,
          jsxOutput: cleanMultiline,
          options: [{
            variables: [
              [
                "defined = ([\\S\\s]*)",
                "^\\s*[\"'`]([^\"'`]+)[\"'`]"
              ]
            ]
          }],
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

});
