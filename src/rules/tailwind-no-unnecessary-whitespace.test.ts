import { createTrimTag, lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe(tailwindNoUnnecessaryWhitespace.name, () => {

  it("should trim leading and trailing white space in literals", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<div class="  b  a  " />`,
          htmlOutput: `<div class="b a" />`,
          jsx: `<div class="  b  a  " />`,
          jsxOutput: `<div class="b a" />`,
          svelte: `<div class="  b  a  " />`,
          svelteOutput: `<div class="b a" />`,
          vue: `<template><div class="  b  a  " /></template>`,
          vueOutput: `<template><div class="b a" /></template>`
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
          html: `<div class="${dirtyEmptyMultilineString}" />`,
          htmlOutput: `<div class="${cleanEmptyMultilineString}" />`,
          jsx: `<div class="${dirtyEmptyMultilineString}" />`,
          jsxOutput: `<div class="${cleanEmptyMultilineString}" />`,
          svelte: `<div class="${dirtyEmptyMultilineString}" />`,
          svelteOutput: `<div class="${cleanEmptyMultilineString}" />`,
          vue: `<template><div class="${dirtyEmptyMultilineString}" /></template>`,
          vueOutput: `<template><div class="${cleanEmptyMultilineString}" /></template>`
        }
      ]
    });
  });

  it("should keep the quotes as they are", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<div class="  b  a  " />`,
          htmlOutput: `<div class="b a" />`,
          jsx: `<div class="  b  a  " />`,
          jsxOutput: `<div class="b a" />`,
          svelte: `<div class="  b  a  " />`,
          svelteOutput: `<div class="b a" />`,
          vue: `<template><div class="  b  a  " /></template>`,
          vueOutput: `<template><div class="b a" /></template>`
        },
        {
          errors: 1,
          html: "<div class='  b  a  ' />",
          htmlOutput: "<div class='b a' />",
          jsx: "<div class='  b  a  ' />",
          jsxOutput: "<div class='b a' />",
          svelte: "<div class='  b  a  ' />",
          svelteOutput: "<div class='b a' />",
          vue: "<template><div class='  b  a  ' /></template>",
          vueOutput: "<template><div class='b a' /></template>"
        },
        {
          errors: 1,
          jsx: "<div class={`  b  a  `} />",
          jsxOutput: "<div class={`b a`} />",
          svelte: "<div class={`  b  a  `} />",
          svelteOutput: "<div class={`b a`} />"
        },
        {
          errors: 1,
          jsx: `<div class={"  b  a  "} />`,
          jsxOutput: `<div class={"b a"} />`,
          svelte: `<div class={"  b  a  "} />`,
          svelteOutput: `<div class={"b a"} />`
        },
        {
          errors: 1,
          jsx: "<div class={'  b  a  '} />",
          jsxOutput: "<div class={'b a'} />",
          svelte: "<div class={'  b  a  '} />",
          svelteOutput: "<div class={'b a'} />"
        }
      ]
    });
  });

  it("should keep one whitespace around template elements", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: "<div class={`  b  a  ${'  c  '}  d  `} />",
          jsxOutput: "<div class={`b a ${'  c  '} d`} />",
          svelte: "<div class={`  b  a  ${'  c  '}  d  `} />",
          svelteOutput: "<div class={`b a ${'  c  '} d`} />"
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
          html: `<div class="${dirty}" />`,
          htmlOutput: `<div class="${clean}" />`,
          jsx: `<div class={\`${dirty}\`} />`,
          jsxOutput: `<div class={\`${clean}\`} />`,
          svelte: `<div class={\`${dirty}\`} />`,
          svelteOutput: `<div class={\`${clean}\`} />`,
          vue: `<template><div class="${dirty}" /></template>`,
          vueOutput: `<template><div class="${clean}" /></template>`
        }
      ]
    });

  });

  it("should keep no whitespace at the end of the line in multiline strings with template elements", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? ' true ' : ' false '}";

    const dirtyExpressionAtStart = trim`
      ${expression}  
      a  
    `;
    const cleanExpressionAtStart = trim`
      ${expression}
      a
    `;

    const dirtyExpressionBetween = trim`
      a  
      ${expression}  
      b  
    `;
    const cleanExpressionBetween = trim`
      a
      ${expression}
      b
    `;

    const dirtyExpressionAtEnd = trim`
      a  
      ${expression}  
    `;
    const cleanExpressionAtEnd = trim`
      a
      ${expression}
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `<div class={\`${dirtyExpressionAtStart}\`} />`,
          jsxOutput: `<div class={\`${cleanExpressionAtStart}\`} />`,
          svelte: `<div class={\`${dirtyExpressionAtStart}\`} />`,
          svelteOutput: `<div class={\`${cleanExpressionAtStart}\`} />`
        },
        {
          errors: 2,
          jsx: `<div class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `<div class={\`${cleanExpressionBetween}\`} />`,
          svelte: `<div class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<div class={\`${cleanExpressionBetween}\`} />`
        },
        {
          errors: 2,
          jsx: `<div class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `<div class={\`${cleanExpressionAtEnd}\`} />`,
          svelte: `<div class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<div class={\`${cleanExpressionAtEnd}\`} />`
        }
      ]
    });

  });

  it("should remove unnecessary whitespace around template literal elements", () => {

    const expression = "${true ? ' true ' : ' false '}";

    const invalidAtStart = `  ${expression}   a  `;
    const validAtStart = `${expression} a`;

    const invalidBetween = `  a  ${expression}  b  `;
    const validBetween = `a ${expression} b`;

    const invalidAtEnd = `  a  ${expression}  `;
    const validAtEnd = `a ${expression}`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `<div class={\`${invalidAtStart}\`} />`,
          jsxOutput: `<div class={\`${validAtStart}\`} />`,
          svelte: `<div class={\`${invalidAtStart}\`} />`,
          svelteOutput: `<div class={\`${validAtStart}\`} />`
        },
        {
          errors: 2,
          jsx: `<div class={\`${invalidBetween}\`} />`,
          jsxOutput: `<div class={\`${validBetween}\`} />`,
          svelte: `<div class={\`${invalidBetween}\`} />`,
          svelteOutput: `<div class={\`${validBetween}\`} />`
        },
        {
          errors: 2,
          jsx: `<div class={\`${invalidAtEnd}\`} />`,
          jsxOutput: `<div class={\`${validAtEnd}\`} />`,
          svelte: `<div class={\`${invalidAtEnd}\`} />`,
          svelteOutput: `<div class={\`${validAtEnd}\`} />`
        }
      ]
    });

  });

  it("should not create a whitespace around sticky template literal elements", () => {

    const expression = "${true ? ' true ' : ' false '}";

    const invalidAtStart = `  ${expression}a   b  `;
    const validAtStart = `${expression}a b`;

    const invalidBetween = `  a  b${expression}c  d  `;
    const validBetween = `a b${expression}c d`;

    const invalidAtEnd = `  a${expression}  `;
    const validAtEnd = `a${expression}`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: `<div class={\`${invalidAtStart}\`} />`,
          jsxOutput: `<div class={\`${validAtStart}\`} />`,
          svelte: `<div class={\`${invalidAtStart}\`} />`,
          svelteOutput: `<div class={\`${validAtStart}\`} />`
        },
        {
          errors: 2,
          jsx: `<div class={\`${invalidBetween}\`} />`,
          jsxOutput: `<div class={\`${validBetween}\`} />`,
          svelte: `<div class={\`${invalidBetween}\`} />`,
          svelteOutput: `<div class={\`${validBetween}\`} />`
        },
        {
          errors: 2,
          jsx: `<div class={\`${invalidAtEnd}\`} />`,
          jsxOutput: `<div class={\`${validAtEnd}\`} />`,
          svelte: `<div class={\`${invalidAtEnd}\`} />`,
          svelteOutput: `<div class={\`${validAtEnd}\`} />`
        }
      ]
    });

  });

  it("should not remove leading newlines in template literal elements", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? ' true ' : ' false '}";

    const validSeparateLineAtStart = trim`
      ${expression}
      b
    `;
    const validSeparateLineBetween = trim`
      a
      ${expression}
      b
    `;
    const validSeparateLineAtEnd = trim`
      a
      ${expression}
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      valid: [
        {
          jsx: `<div class={\`${validSeparateLineAtStart}\`} />`,
          svelte: `<div class={\`${validSeparateLineAtStart}\`} />`
        },
        {
          jsx: `<div class={\`${validSeparateLineBetween}\`} />`,
          svelte: `<div class={\`${validSeparateLineBetween}\`} />`
        },
        {
          jsx: `<div class={\`${validSeparateLineAtEnd}\`} />`,
          svelte: `<div class={\`${validSeparateLineAtEnd}\`} />`
        }
      ]
    });

  });


  it("should remove whitespace around template elements if they are at the beginning or end", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: "<div class={`  ${' b '}  a  d  ${'  c  '}  `} />",
          jsxOutput: "<div class={`${' b '} a d ${'  c  '}`} />",
          svelte: "<div class={`  ${' b '}  a  d  ${'  c  '}  `} />",
          svelteOutput: "<div class={`${' b '} a d ${'  c  '}`} />"
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
          html: `<div class="${uncleanedMultilineString}" />`,
          htmlOutput: `<div class="${cleanedMultilineString}" />`,
          svelte: `<div class="${uncleanedMultilineString}" />`,
          svelteOutput: `<div class="${cleanedMultilineString}" />`,
          vue: `<template><div class="${uncleanedMultilineString}" /></template>`,
          vueOutput: `<template><div class="${cleanedMultilineString}" /></template>`
        },
        {
          errors: 1,
          html: `<div class='${uncleanedMultilineString}' />`,
          htmlOutput: `<div class='${cleanedMultilineString}' />`,
          svelte: `<div class='${uncleanedMultilineString}' />`,
          svelteOutput: `<div class='${cleanedMultilineString}' />`,
          vue: `<template><div class='${uncleanedMultilineString}' /></template>`,
          vueOutput: `<template><div class='${cleanedMultilineString}' /></template>`
        },
        {
          errors: 1,
          jsx: `<div class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `<div class={\`${cleanedMultilineString}\`} />`,
          svelte: `<div class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<div class={\`${cleanedMultilineString}\`} />`
        },
        {
          errors: 1,
          html: `<div class='${uncleanedMultilineString}' />`,
          htmlOutput: `<div class='${cleanedSinglelineString}' />`,
          jsx: `<div class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `<div class={\`${cleanedSinglelineString}\`} />`,
          options: [{ allowMultiline: false }],
          svelte: `<div class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<div class={\`${cleanedSinglelineString}\`} />`,
          vue: `<template><div class='${uncleanedMultilineString}' /></template>`,
          vueOutput: `<template><div class='${cleanedSinglelineString}' /></template>`
        }
      ],
      valid: [
        {
          html: `<div class="${cleanedMultilineString}" />`,
          jsx: `<div class={\`${cleanedMultilineString}\`} />`,
          svelte: `<div class="${cleanedMultilineString}" />`,
          vue: `<template><div class="${cleanedMultilineString}" /></template>`
        },
        {
          html: `<div class="${cleanedSinglelineString}" />`,
          jsx: `<div class="${cleanedSinglelineString}" />`,
          svelte: `<div class="${cleanedSinglelineString}" />`,
          vue: `<template><div class="${cleanedSinglelineString}" /></template>`
        }
      ]
    });
  });

  it("should not remove whitespace before in template literal elements", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? ' true ' : ' false '}";

    const validAtStart = trim`
      ${expression}
      b
    `;
    const validAround = trim`
      a
      ${expression}
      b
    `;
    const validAtEnd = trim`
      a
      ${expression}
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      valid: [
        {
          jsx: `<div class={\`${validAtStart}\`} />`,
          svelte: `<div class={\`${validAtStart}\`} />`
        },
        {
          jsx: `<div class={\`${validAround}\`} />`,
          svelte: `<div class={\`${validAround}\`} />`
        },
        {
          jsx: `<div class={\`${validAtEnd}\`} />`,
          svelte: `<div class={\`${validAtEnd}\`} />`
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
          jsx: `<div class={\`${dirtyDefinedMultiline}\`} />`,
          jsxOutput: `<div class={\`${cleanDefinedMultiline}\`} />`,
          options: [{ callees: ["defined"] }],
          svelte: `<div class={\`${dirtyDefinedMultiline}\`} />`,
          svelteOutput: `<div class={\`${cleanDefinedMultiline}\`} />`
        }
      ],
      valid: [
        {
          jsx: `<div class={\`${dirtyUndefinedMultiline}\`} />`,
          svelte: `<div class={\`${dirtyUndefinedMultiline}\`} />`
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
