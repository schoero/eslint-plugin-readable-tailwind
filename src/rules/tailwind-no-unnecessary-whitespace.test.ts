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
          jsx: `<img class="  b  a  " />`,
          jsxOutput: `<img class="b a" />`,
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
          jsx: `<img class="${dirtyEmptyMultilineString}" />`,
          jsxOutput: `<img class="${cleanEmptyMultilineString}" />`,
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
          jsx: `<img class="  b  a  " />`,
          jsxOutput: `<img class="b a" />`,
          svelte: `<img class="  b  a  " />`,
          svelteOutput: `<img class="b a" />`,
          vue: `<template><img class="  b  a  " /></template>`,
          vueOutput: `<template><img class="b a" /></template>`
        },
        {
          errors: 1,
          html: "<img class='  b  a  ' />",
          htmlOutput: "<img class='b a' />",
          jsx: "<img class='  b  a  ' />",
          jsxOutput: "<img class='b a' />",
          svelte: "<img class='  b  a  ' />",
          svelteOutput: "<img class='b a' />",
          vue: "<template><img class='  b  a  ' /></template>",
          vueOutput: "<template><img class='b a' /></template>"
        },
        {
          errors: 1,
          jsx: "<img class={`  b  a  `} />",
          jsxOutput: "<img class={`b a`} />",
          svelte: "<img class={`  b  a  `} />",
          svelteOutput: "<img class={`b a`} />"
        },
        {
          errors: 1,
          jsx: `<img class={"  b  a  "} />`,
          jsxOutput: `<img class={"b a"} />`,
          svelte: `<img class={"  b  a  "} />`,
          svelteOutput: `<img class={"b a"} />`
        },
        {
          errors: 1,
          jsx: "<img class={'  b  a  '} />",
          jsxOutput: "<img class={'b a'} />",
          svelte: "<img class={'  b  a  '} />",
          svelteOutput: "<img class={'b a'} />"
        }
      ]
    });
  });

  it("should keep one whitespace around template elements", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: "<img class={`  b  a  ${'  c  '}  d  `} />",
          jsxOutput: "<img class={`b a ${'  c  '} d`} />",
          svelte: "<img class={`  b  a  ${'  c  '}  d  `} />",
          svelteOutput: "<img class={`b a ${'  c  '} d`} />"
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
          jsx: `<img class={\`${dirty}\`} />`,
          jsxOutput: `<img class={\`${clean}\`} />`,
          svelte: `<img class={\`${dirty}\`} />`,
          svelteOutput: `<img class={\`${clean}\`} />`,
          vue: `<template><img class="${dirty}" /></template>`,
          vueOutput: `<template><img class="${clean}" /></template>`
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
          jsx: `<img class={\`${dirtyExpressionAtStart}\`} />`,
          jsxOutput: `<img class={\`${cleanExpressionAtStart}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtStart}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtStart}\`} />`
        },
        {
          errors: 2,
          jsx: `<img class={\`${dirtyExpressionBetween}\`} />`,
          jsxOutput: `<img class={\`${cleanExpressionBetween}\`} />`,
          svelte: `<img class={\`${dirtyExpressionBetween}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionBetween}\`} />`
        },
        {
          errors: 2,
          jsx: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          jsxOutput: `<img class={\`${cleanExpressionAtEnd}\`} />`,
          svelte: `<img class={\`${dirtyExpressionAtEnd}\`} />`,
          svelteOutput: `<img class={\`${cleanExpressionAtEnd}\`} />`
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
          jsx: `<img class={\`${invalidAtStart}\`} />`,
          jsxOutput: `<img class={\`${validAtStart}\`} />`,
          svelte: `<img class={\`${invalidAtStart}\`} />`,
          svelteOutput: `<img class={\`${validAtStart}\`} />`
        },
        {
          errors: 2,
          jsx: `<img class={\`${invalidBetween}\`} />`,
          jsxOutput: `<img class={\`${validBetween}\`} />`,
          svelte: `<img class={\`${invalidBetween}\`} />`,
          svelteOutput: `<img class={\`${validBetween}\`} />`
        },
        {
          errors: 2,
          jsx: `<img class={\`${invalidAtEnd}\`} />`,
          jsxOutput: `<img class={\`${validAtEnd}\`} />`,
          svelte: `<img class={\`${invalidAtEnd}\`} />`,
          svelteOutput: `<img class={\`${validAtEnd}\`} />`
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
          jsx: `<img class={\`${invalidAtStart}\`} />`,
          jsxOutput: `<img class={\`${validAtStart}\`} />`,
          svelte: `<img class={\`${invalidAtStart}\`} />`,
          svelteOutput: `<img class={\`${validAtStart}\`} />`
        },
        {
          errors: 2,
          jsx: `<img class={\`${invalidBetween}\`} />`,
          jsxOutput: `<img class={\`${validBetween}\`} />`,
          svelte: `<img class={\`${invalidBetween}\`} />`,
          svelteOutput: `<img class={\`${validBetween}\`} />`
        },
        {
          errors: 2,
          jsx: `<img class={\`${invalidAtEnd}\`} />`,
          jsxOutput: `<img class={\`${validAtEnd}\`} />`,
          svelte: `<img class={\`${invalidAtEnd}\`} />`,
          svelteOutput: `<img class={\`${validAtEnd}\`} />`
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
          jsx: `<img class={\`${validSeparateLineAtStart}\`} />`,
          svelte: `<img class={\`${validSeparateLineAtStart}\`} />`
        },
        {
          jsx: `<img class={\`${validSeparateLineBetween}\`} />`,
          svelte: `<img class={\`${validSeparateLineBetween}\`} />`
        },
        {
          jsx: `<img class={\`${validSeparateLineAtEnd}\`} />`,
          svelte: `<img class={\`${validSeparateLineAtEnd}\`} />`
        }
      ]
    });

  });


  it("should remove whitespace around template elements if they are at the beginning or end", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: "<img class={`  ${' b '}  a  d  ${'  c  '}  `} />",
          jsxOutput: "<img class={`${' b '} a d ${'  c  '}`} />",
          svelte: "<img class={`  ${' b '}  a  d  ${'  c  '}  `} />",
          svelteOutput: "<img class={`${' b '} a d ${'  c  '}`} />"
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
          jsx: `<img class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `<img class={\`${cleanedMultilineString}\`} />`,
          svelte: `<img class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<img class={\`${cleanedMultilineString}\`} />`
        },
        {
          errors: 1,
          html: `<img class='${uncleanedMultilineString}' />`,
          htmlOutput: `<img class='${cleanedSinglelineString}' />`,
          jsx: `<img class={\`${uncleanedMultilineString}\`} />`,
          jsxOutput: `<img class={\`${cleanedSinglelineString}\`} />`,
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
          jsx: `<img class={\`${cleanedMultilineString}\`} />`,
          svelte: `<img class="${cleanedMultilineString}" />`,
          vue: `<template><img class="${cleanedMultilineString}" /></template>`
        },
        {
          html: `<img class="${cleanedSinglelineString}" />`,
          jsx: `<img class="${cleanedSinglelineString}" />`,
          svelte: `<img class="${cleanedSinglelineString}" />`,
          vue: `<template><img class="${cleanedSinglelineString}" /></template>`
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
          jsx: `<img class={\`${validAtStart}\`} />`,
          svelte: `<img class={\`${validAtStart}\`} />`
        },
        {
          jsx: `<img class={\`${validAround}\`} />`,
          svelte: `<img class={\`${validAround}\`} />`
        },
        {
          jsx: `<img class={\`${validAtEnd}\`} />`,
          svelte: `<img class={\`${validAtEnd}\`} />`
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
          jsx: `<img class={\`${dirtyDefinedMultiline}\`} />`,
          jsxOutput: `<img class={\`${cleanDefinedMultiline}\`} />`,
          options: [{ callees: ["defined"] }],
          svelte: `<img class={\`${dirtyDefinedMultiline}\`} />`,
          svelteOutput: `<img class={\`${cleanDefinedMultiline}\`} />`
        }
      ],
      valid: [
        {
          jsx: `<img class={\`${dirtyUndefinedMultiline}\`} />`,
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
