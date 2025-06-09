import { describe, it } from "vitest";

import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";
import { dedent } from "better-tailwindcss:tests/utils/template.js";


describe(noUnnecessaryWhitespace.name, () => {

  it("should trim leading and trailing white space in literals", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="  b  a  " />`,
          angularOutput: `<img class="b a" />`,
          html: `<img class="  b  a  " />`,
          htmlOutput: `<img class="b a" />`,
          jsx: `() => <img class="  b  a  " />`,
          jsxOutput: `() => <img class="b a" />`,
          svelte: `<img class="  b  a  " />`,
          svelteOutput: `<img class="b a" />`,
          vue: `<template><img class="  b  a  " /></template>`,
          vueOutput: `<template><img class="b a" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should collapse empty multiline strings", () => {
    const dirtyEmptyMultilineString = `

    `;
    const cleanEmptyMultilineString = "";

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="${dirtyEmptyMultilineString}" />`,
          angularOutput: `<img class="${cleanEmptyMultilineString}" />`,
          html: `<img class="${dirtyEmptyMultilineString}" />`,
          htmlOutput: `<img class="${cleanEmptyMultilineString}" />`,
          jsx: `() => <img class="${dirtyEmptyMultilineString}" />`,
          jsxOutput: `() => <img class="${cleanEmptyMultilineString}" />`,
          svelte: `<img class="${dirtyEmptyMultilineString}" />`,
          svelteOutput: `<img class="${cleanEmptyMultilineString}" />`,
          vue: `<template><img class="${dirtyEmptyMultilineString}" /></template>`,
          vueOutput: `<template><img class="${cleanEmptyMultilineString}" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should keep the quotes as they are", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="  b  a  " />`,
          angularOutput: `<img class="b a" />`,
          html: `<img class="  b  a  " />`,
          htmlOutput: `<img class="b a" />`,
          jsx: `() => <img class="  b  a  " />`,
          jsxOutput: `() => <img class="b a" />`,
          svelte: `<img class="  b  a  " />`,
          svelteOutput: `<img class="b a" />`,
          vue: `<template><img class="  b  a  " /></template>`,
          vueOutput: `<template><img class="b a" /></template>`,

          errors: 1
        },
        {
          angular: `<img class='  b  a  ' />`,
          angularOutput: `<img class='b a' />`,
          html: `<img class='  b  a  ' />`,
          htmlOutput: `<img class='b a' />`,
          jsx: `() => <img class='  b  a  ' />`,
          jsxOutput: `() => <img class='b a' />`,
          svelte: `<img class='  b  a  ' />`,
          svelteOutput: `<img class='b a' />`,
          vue: `<template><img class='  b  a  ' /></template>`,
          vueOutput: `<template><img class='b a' /></template>`,

          errors: 1
        },
        {
          jsx: `() => <img class={\`  b  a  \`} />`,
          jsxOutput: `() => <img class={\`b a\`} />`,
          svelte: `<img class={\`  b  a  \`} />`,
          svelteOutput: `<img class={\`b a\`} />`,

          errors: 1
        },
        {
          jsx: `() => <img class={"  b  a  "} />`,
          jsxOutput: `() => <img class={"b a"} />`,
          svelte: `<img class={"  b  a  "} />`,
          svelteOutput: `<img class={"b a"} />`,

          errors: 1
        },
        {
          jsx: `() => <img class={'  b  a  '} />`,
          jsxOutput: `() => <img class={'b a'} />`,
          svelte: `<img class={'  b  a  '} />`,
          svelteOutput: `<img class={'b a'} />`,

          errors: 1
        }
      ]
    });
  });

  it("should keep one whitespace around template elements", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix template literal.
        {
          jsx: `() => <img class={\`  b  a  \${"  c  "}  d  \`} />`,
          jsxOutput: `() => <img class={\`b a \${"  c  "} d\`} />`,
          svelte: `<img class={\`  b  a  \${"  c  "}  d  \`} />`,
          svelteOutput: `<img class={\`b a \${"  c  "} d\`} />`,

          errors: 3
        },
        // 2nd pass: fix inner template element.
        {
          jsx: `() => <img class={\`b a \${"  c  "} d\`} />`,
          jsxOutput: `() => <img class={\`b a \${"c"} d\`} />`,
          svelte: `<img class={\`b a \${"  c  "} d\`} />`,
          svelteOutput: `<img class={\`b a \${"c"} d\`} />`,

          errors: 1
        }
      ]
    });
  });

  it("should keep no whitespace at the end of the line in multiline strings", () => {

    const dirty = dedent`
      a      
      b  
      c    
    `;

    const clean = dedent`
      a
      b
      c
    `;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
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

  it("should remove unnecessary whitespace inside and around multiline template literal elements", () => {

    const dirtyExpression = "${true ? '  true  ' : '  false  '}";
    const cleanExpression = "${true ? 'true' : 'false'}";

    const dirtyExpressionAtStart = dedent`
      ${dirtyExpression}  
      a  
    `;
    const cleanExpressionAtStartPass1 = dedent`
      ${cleanExpression}  
      a  
    `;
    const cleanExpressionAtStartPass2 = dedent`
      ${cleanExpression}
      a
    `;

    const dirtyExpressionBetween = dedent`
      a  
      ${dirtyExpression}  
      b  
    `;
    const cleanExpressionBetweenPass1 = dedent`
      a
      ${cleanExpression}  
      b  
    `;
    const cleanExpressionBetweenPass2 = dedent`
      a
      ${cleanExpression}
      b
    `;

    const dirtyExpressionAtEnd = dedent`
      a  
      ${dirtyExpression}  
    `;
    const cleanExpressionAtEndPass1 = dedent`
      a
      ${cleanExpression}  
    `;
    const cleanExpressionAtEndPass2 = dedent`
      a
      ${cleanExpression}
    `;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix template literal.
        {
          jsx: `() => <img class={\`${dirtyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass1}\`} />`,

          errors: 3
        },
        // 2nd pass: fix expression.
        {
          jsx: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass2}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass2}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass2}\`} />`,

          errors: 1
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyExpressionAtStartAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStartAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanExpressionAtStartPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtStartPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtStartPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStartPass2}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanExpressionBetweenPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionBetweenPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionBetweenPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetweenPass2}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanExpressionAtEndPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanExpressionAtEndPass2}\`} />`,
          svelte: `<img class={\`${cleanExpressionAtEndPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEndPass2}\`} />`,

          errors: 1
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtStartPass2}\`} />`,
          svelte: `<img class={\`${cleanStickyExpressionAtStartPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtStartPass2}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionBetween}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionBetweenPass2}\`} />`,
          svelte: `<img class={\`${cleanStickyExpressionBetweenPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionBetweenPass2}\`} />`,

          errors: 1
        }
      ]
    });

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        // eslint doesn't support multi-pass fixes: https://github.com/eslint/eslint/issues/18007
        // 1st pass: fix leading template element and expression.
        {
          jsx: `() => <img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,
          svelte: `<img class={\`${dirtyStickyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,

          errors: 4
        },
        // 2nd pass: fix trailing template element.
        {
          jsx: `() => <img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,
          jsxOutput: `() => <img class={\`${cleanStickyExpressionAtEndPass2}\`} />`,
          svelte: `<img class={\`${cleanStickyExpressionAtEndPass1}\`} />`,
          svelteOutput: `<img class={\`${cleanStickyExpressionAtEndPass2}\`} />`,

          errors: 1
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="${uncleanedMultilineString}" />`,
          angularOutput: `<img class="${cleanedMultilineString}" />`,
          html: `<img class="${uncleanedMultilineString}" />`,
          htmlOutput: `<img class="${cleanedMultilineString}" />`,
          svelte: `<img class="${uncleanedMultilineString}" />`,
          svelteOutput: `<img class="${cleanedMultilineString}" />`,
          vue: `<template><img class="${uncleanedMultilineString}" /></template>`,
          vueOutput: `<template><img class="${cleanedMultilineString}" /></template>`,

          errors: 1
        },
        {
          angular: `<img class='${uncleanedMultilineString}' />`,
          angularOutput: `<img class='${cleanedMultilineString}' />`,
          html: `<img class='${uncleanedMultilineString}' />`,
          htmlOutput: `<img class='${cleanedMultilineString}' />`,
          svelte: `<img class='${uncleanedMultilineString}' />`,
          svelteOutput: `<img class='${cleanedMultilineString}' />`,
          vue: `<template><img class='${uncleanedMultilineString}' /></template>`,
          vueOutput: `<template><img class='${cleanedMultilineString}' /></template>`,

          errors: 1
        },
        {
          jsx: `() => <img class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `() => <img class={\`${cleanedMultilineString}\`} />`,
          svelte: `<img class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<img class={\`${cleanedMultilineString}\`} />`,

          errors: 1
        },
        {
          angular: `<img class='${uncleanedMultilineString}' />`,
          angularOutput: `<img class='${cleanedSinglelineString}' />`,
          html: `<img class='${uncleanedMultilineString}' />`,
          htmlOutput: `<img class='${cleanedSinglelineString}' />`,
          jsx: `() => <img class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `() => <img class={\`${cleanedSinglelineString}\`} />`,
          svelte: `<img class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<img class={\`${cleanedSinglelineString}\`} />`,
          vue: `<template><img class='${uncleanedMultilineString}' /></template>`,
          vueOutput: `<template><img class='${cleanedSinglelineString}' /></template>`,

          errors: 1,
          options: [{ allowMultiline: false }]
        }
      ],
      valid: [
        {
          angular: `<img class="${cleanedMultilineString}" />`,
          html: `<img class="${cleanedMultilineString}" />`,
          jsx: `() => <img class={\`${cleanedMultilineString}\`} />`,
          svelte: `<img class="${cleanedMultilineString}" />`,
          vue: `<template><img class="${cleanedMultilineString}" /></template>`
        },
        {
          angular: `<img class="${cleanedSinglelineString}" />`,
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
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
      noUnnecessaryWhitespace,
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirtyDefinedMultiline}\`} />`,
          jsxOutput: `() => <img class={\`${cleanDefinedMultiline}\`} />`,
          svelte: `<img class={\`${dirtyDefinedMultiline}\`} />`,
          svelteOutput: `<img class={\`${cleanDefinedMultiline}\`} />`,

          errors: 1,
          options: [{ callees: ["defined"] }]
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
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

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
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
            variables: [
              [
                "defined = ([\\S\\s]*)",
                "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
              ]
            ]
          }]
        },
        {
          jsx: dirtyMultiline,
          jsxOutput: cleanMultiline,
          svelte: `<script>${dirtyMultiline}</script>`,
          svelteOutput: `<script>${cleanMultiline}</script>`,
          vue: `<script>${dirtyMultiline}</script>`,
          vueOutput: `<script>${cleanMultiline}</script>`,

          errors: 1,
          options: [{
            variables: [
              [
                "defined = ([\\S\\s]*)",
                "^\\s*[\"'`]([^\"'`]+)[\"'`]"
              ]
            ]
          }]
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

  it("should remove unnecessary whitespace in string literals in defined tagged template literals", () => {
    lint(
      noUnnecessaryWhitespace,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            jsx: "defined`  b   a  `",
            jsxOutput: "defined`b a`",
            svelte: "<script>defined`  b   a  `</script>",
            svelteOutput: "<script>defined`b a`</script>",
            vue: "defined`  b   a  `",
            vueOutput: "defined`b a`",

            errors: 1,
            options: [{ tags: ["defined"] }]
          }
        ],
        valid: [
          {
            jsx: "notDefined`  b   a  `",
            svelte: "<script>notDefined`  b   a  `</script>",
            vue: "notDefined`  b   a  `",

            options: [{ tags: ["defined"] }]
          }
        ]
      }
    );
  });

});
