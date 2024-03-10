import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe(tailwindNoUnnecessaryWhitespace.name, () => {

  it("should trim leading and trailing white space in literals", () => expect(
    void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: "<div class=\"  b  a  \" />",
          htmlOutput: "<div class=\"b a\" />",
          jsx: "const Test = () => <div class=\"  b  a  \" />;",
          jsxOutput: "const Test = () => <div class=\"b a\" />;",
          svelte: "<div class=\"  b  a  \" />",
          svelteOutput: "<div class=\"b a\" />",
          vue: "<template><div class=\"  b  a  \" /></template>",
          vueOutput: "<template><div class=\"b a\" /></template>"
        }
      ]
    })
  ).toBeUndefined());

  it("should collapse empty multiline strings", () => {
    const dirtyEmptyMultilineString = `

    `;
    const cleanEmptyMultilineString = "";

    expect(
      void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            errors: 1,
            html: `<div class="${dirtyEmptyMultilineString}" />`,
            htmlOutput: `<div class="${cleanEmptyMultilineString}" />`,
            jsx: `const Test = () => <div class="${dirtyEmptyMultilineString}" />;`,
            jsxOutput: `const Test = () => <div class="${cleanEmptyMultilineString}" />;`,
            svelte: `<div class="${dirtyEmptyMultilineString}" />`,
            svelteOutput: `<div class="${cleanEmptyMultilineString}" />`,
            vue: `<template><div class="${dirtyEmptyMultilineString}" /></template>`,
            vueOutput: `<template><div class="${cleanEmptyMultilineString}" /></template>`
          }
        ]
      })
    ).toBeUndefined();
  });

  it("should keep the quotes as they are", () => expect(
    void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: "<div class=\"  b  a  \" />",
          htmlOutput: "<div class=\"b a\" />",
          jsx: "const Test = () => <div class=\"  b  a  \" />;",
          jsxOutput: "const Test = () => <div class=\"b a\" />;",
          svelte: "<div class=\"  b  a  \" />",
          svelteOutput: "<div class=\"b a\" />",
          vue: "<template><div class=\"  b  a  \" /></template>",
          vueOutput: "<template><div class=\"b a\" /></template>"
        },
        {
          errors: 1,
          html: "<div class='  b  a  ' />",
          htmlOutput: "<div class='b a' />",
          jsx: "const Test = () => <div class='  b  a  ' />;",
          jsxOutput: "const Test = () => <div class='b a' />;",
          svelte: "<div class='  b  a  ' />",
          svelteOutput: "<div class='b a' />",
          vue: "<template><div class='  b  a  ' /></template>",
          vueOutput: "<template><div class='b a' /></template>"
        },
        {
          errors: 1,
          jsx: "const Test = () => <div class={`  b  a  `} />;",
          jsxOutput: "const Test = () => <div class={`b a`} />;",
          svelte: "<div class={`  b  a  `} />",
          svelteOutput: "<div class={`b a`} />"
        },
        {
          errors: 1,
          jsx: "const Test = () => <div class={\"  b  a  \"} />;",
          jsxOutput: "const Test = () => <div class={\"b a\"} />;",
          svelte: "<div class={\"  b  a  \"} />",
          svelteOutput: "<div class={\"b a\"} />"
        },
        {
          errors: 1,
          jsx: "const Test = () => <div class={'  b  a  '} />;",
          jsxOutput: "const Test = () => <div class={'b a'} />;",
          svelte: "<div class={'  b  a  '} />",
          svelteOutput: "<div class={'b a'} />"
        }
      ]
    })
  ).toBeUndefined());

  it("should keep one whitespace around template elements", () => expect(
    void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: "const Test = () => <div class={`  b  a  ${'  c  '}  d  `} />;",
          jsxOutput: "const Test = () => <div class={`b a ${'  c  '} d`} />;",
          svelte: "<div class={`  b  a  ${'  c  '}  d  `} />",
          svelteOutput: "<div class={`b a ${'  c  '} d`} />"
        }
      ]
    })
  ).toBeUndefined());

  it("should remove whitespace around template elements if they are at the beginning or end", () => expect(
    void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: "const Test = () => <div class={`  ${' b '}  a  d  ${'  c  '}  `} />;",
          jsxOutput: "const Test = () => <div class={`${' b '} a d ${'  c  '}`} />;",
          svelte: "<div class={`  ${' b '}  a  d  ${'  c  '}  `} />",
          svelteOutput: "<div class={`${' b '} a d ${'  c  '}`} />"
        }
      ]
    })
  ).toBeUndefined());

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

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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
          jsx: `const Test = () => <div class={\`${uncleanedMultilineString}\`} />;`,
          jsxOutput: `const Test = () => <div class={\`${cleanedMultilineString}\`} />;`,
          svelte: `<div class={\`${uncleanedMultilineString}\`} />`,
          svelteOutput: `<div class={\`${cleanedMultilineString}\`} />`
        },
        {
          errors: 1,
          html: `<div class='${uncleanedMultilineString}' />`,
          htmlOutput: `<div class='${cleanedSinglelineString}' />`,
          jsx: `const Test = () => <div class={\`${uncleanedMultilineString}\`} />;`,
          jsxOutput: `const Test = () => <div class={\`${cleanedSinglelineString}\`} />;`,
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
          jsx: `const Test = () => <div class={\`${cleanedMultilineString}\`} />;`,
          svelte: `<div class="${cleanedMultilineString}" />`,
          vue: `<template><div class="${cleanedMultilineString}" /></template>`
        },
        {
          html: `<div class="${cleanedSinglelineString}" />`,
          jsx: `const Test = () => <div class="${cleanedSinglelineString}" />;`,
          svelte: `<div class="${cleanedSinglelineString}" />`,
          vue: `<template><div class="${cleanedSinglelineString}" /></template>`
        }
      ]
    })).toBeUndefined();
  });

  it("should remove unnecessary whitespace in defined call signature arguments", () => {

    const dirtyDefined = "defined('  f  e  ');";
    const cleanDefined = "defined('f e');";
    const dirtyUndefined = "notDefined(\"  f  e  \");";

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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
    })).toBeUndefined();

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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
    })).toBeUndefined();

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

    expect(void lint(
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
    )).toBeUndefined();

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

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `const Test = () => <div class={\`${dirtyDefinedMultiline}\`} />;`,
          jsxOutput: `const Test = () => <div class={\`${cleanDefinedMultiline}\`} />;`,
          options: [{ callees: ["defined"] }],
          svelte: `<div class={\`${dirtyDefinedMultiline}\`} />`,
          svelteOutput: `<div class={\`${cleanDefinedMultiline}\`} />`
        }
      ],
      valid: [
        {
          jsx: `const Test = () => <div class={\`${dirtyUndefinedMultiline}\`} />;`,
          svelte: `<div class={\`${dirtyUndefinedMultiline}\`} />`
        }
      ]
    })).toBeUndefined();

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

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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
    })).toBeUndefined();

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

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
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
    })).toBeUndefined();

  });

});
