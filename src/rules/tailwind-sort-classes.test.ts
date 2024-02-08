import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";


describe(tailwindSortClasses.name, () => {

  it("should sort simple class names as defined", () => expect(
    void lint(
      tailwindSortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: "<div class=\"b a\" />",
            htmlOutput: "<div class=\"a b\" />",
            jsx: "const Test = () => <div class=\"b a\" />;",
            jsxOutput: "const Test = () => <div class=\"a b\" />;",
            options: [{ order: "asc" }],
            svelte: "<div class=\"b a\" />",
            svelteOutput: "<div class=\"a b\" />",
            vue: "<template><div class=\"b a\" /></template>",
            vueOutput: "<template><div class=\"a b\" /></template>"
          },
          {
            errors: 1,
            html: "<div class=\"a b\" />",
            htmlOutput: "<div class=\"b a\" />",
            jsx: "const Test = () => <div class=\"a b\" />;",
            jsxOutput: "const Test = () => <div class=\"b a\" />;",
            options: [{ order: "desc" }],
            svelte: "<div class=\"a b\" />",
            svelteOutput: "<div class=\"b a\" />",
            vue: "<template><div class=\"a b\" /></template>",
            vueOutput: "<template><div class=\"b a\" /></template>"
          },
          {
            errors: 1,
            html: "<div class=\"w-full absolute\" />",
            htmlOutput: "<div class=\"absolute w-full\" />",
            jsx: "const Test = () => <div class=\"w-full absolute\" />;",
            jsxOutput: "const Test = () => <div class=\"absolute w-full\" />;",
            options: [{ order: "official" }],
            svelte: "<div class=\"w-full absolute\" />",
            svelteOutput: "<div class=\"absolute w-full\" />",
            vue: "<template><div class=\"w-full absolute\" /></template>",
            vueOutput: "<template><div class=\"absolute w-full\" /></template>"
          }
        ],
        valid: [
          {
            html: "<div class=\"a b\" />",
            jsx: "const Test = () => <div class=\"a b\" />;",
            options: [{ order: "asc" }],
            svelte: "<div class=\"a b\" />",
            vue: "<template><div class=\"a b\" /></template>"
          },
          {
            html: "div class=\"b a\" />",
            jsx: "const Test = () => <div class=\"b a\" />;",
            options: [{ order: "desc" }],
            svelte: "div class=\"b a\" />",
            vue: "<template><div class=\"b a\" /></template>"
          },
          {
            html: "<div class=\"absolute w-full\" />",
            jsx: "const Test = () => <div class=\"absolute w-full\" />;",
            options: [{ order: "official" }],
            svelte: "<div class=\"absolute w-full\" />",
            vue: "<template><div class=\"absolute w-full\" /></template>"
          }
        ]
      }
    )
  ).toBeUndefined());

  it("should keep the quotes as they are", () => expect(
    void lint(
      tailwindSortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: "<div class=\"b a\" />",
            htmlOutput: "<div class=\"a b\" />",
            jsx: "const Test = () => <div class=\"b a\" />;",
            jsxOutput: "const Test = () => <div class=\"a b\" />;",
            options: [{ order: "asc" }],
            svelte: "<div class=\"b a\" />",
            svelteOutput: "<div class=\"a b\" />",
            vue: "<template><div class=\"b a\" /></template>",
            vueOutput: "<template><div class=\"a b\" /></template>"
          },
          {
            errors: 1,
            html: "<div class='b a' />",
            htmlOutput: "<div class='a b' />",
            jsx: "const Test = () => <div class='b a' />;",
            jsxOutput: "const Test = () => <div class='a b' />;",
            options: [{ order: "asc" }],
            svelte: "<div class='b a' />",
            svelteOutput: "<div class='a b' />",
            vue: "<template><div class='b a' /></template>",
            vueOutput: "<template><div class='a b' /></template>"
          },
          {
            errors: 1,
            jsx: "const Test = () => <div class={`b a`} />;",
            jsxOutput: "const Test = () => <div class={`a b`} />;",
            options: [{ order: "asc" }],
            svelte: "<div class={`b a`} />",
            svelteOutput: "<div class={`a b`} />"
          },
          {
            errors: 1,
            jsx: "const Test = () => <div class={\"b a\"} />;",
            jsxOutput: "const Test = () => <div class={\"a b\"} />;",
            options: [{ order: "asc" }]
          },
          {
            errors: 1,
            jsx: "const Test = () => <div class={'b a'} />;",
            jsxOutput: "const Test = () => <div class={'a b'} />;",
            options: [{ order: "asc" }]
          }
        ]
      }
    )
  ).toBeUndefined());

  it("should keep expressions as they are", () => expect(
    void lint(tailwindSortClasses, TEST_SYNTAXES, {
      valid: [
        {
          jsx: "const Test = () => <div class={true ? \"a\" : \"b\"} />;",
          svelte: "<div class={true ? \"a\" : \"b\"} />"
        }
      ]
    })
  ).toBeUndefined());

  it("should keep expressions where they are", () => expect(
    void lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: "const Test = () => <div class={`c a ${true ? 'e' : 'f'} d b `} />;",
          jsxOutput: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b d `} />;",
          options: [{ order: "asc" }],
          svelte: "<div class={`c a ${true ? 'e' : 'f'} d b `} />",
          svelteOutput: "<div class={`a c ${true ? 'e' : 'f'} b d `} />"
        }
      ],
      valid: [
        {
          jsx: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b `} />;",
          svelte: "<div class={`a c ${true ? 'e' : 'f'} b `} />"
        }
      ]
    })
  ).toBeUndefined());

  it("should sort multiline strings but keep the whitespace", () => {
    const unsortedMultilineString = `
      d c
      b a
    `;

    const sortedMultilineString = `
      a b
      c d
    `;

    expect(
      void lint(
        tailwindSortClasses,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 1,
              html: `<div class="${unsortedMultilineString}" />`,
              htmlOutput: `<div class="${sortedMultilineString}" />`,
              options: [{ order: "asc" }],
              svelte: `<div class="${unsortedMultilineString}" />`,
              svelteOutput: `<div class="${sortedMultilineString}" />`,
              vue: `<template><div class="${unsortedMultilineString}" /></template>`,
              vueOutput: `<template><div class="${sortedMultilineString}" /></template>`
            },
            {
              errors: 1,
              html: `<div class='${unsortedMultilineString}' />`,
              htmlOutput: `<div class='${sortedMultilineString}' />`,
              options: [{ order: "asc" }],
              svelte: `<div class='${unsortedMultilineString}' />`,
              svelteOutput: `<div class='${sortedMultilineString}' />`,
              vue: `<template><div class='${unsortedMultilineString}' /></template>`,
              vueOutput: `<template><div class='${sortedMultilineString}' /></template>`
            },
            {
              errors: 1,
              jsx: `const Test = () => <div class={\`${unsortedMultilineString}\`} />;`,
              jsxOutput: `const Test = () => <div class={\`${sortedMultilineString}\`} />;`,
              options: [{ order: "asc" }],
              svelte: `<div class={\`${unsortedMultilineString}\`} />`,
              svelteOutput: `<div class={\`${sortedMultilineString}\`} />`
            }
          ],
          valid: [
            {
              html: `<div class="${sortedMultilineString}" />`,
              options: [{ order: "asc" }],
              svelte: `<div class="${sortedMultilineString}" />`,
              vue: `<template><div class="${sortedMultilineString}" /></template>`
            },
            {
              html: `<div class='${sortedMultilineString}' />`,
              options: [{ order: "asc" }],
              svelte: `<div class='${sortedMultilineString}' />`,
              vue: `<template><div class='${sortedMultilineString}' /></template>`
            },
            {
              jsx: `const Test = () => <div class={\`${sortedMultilineString}\`} />;`,
              options: [{ order: "asc" }],
              svelte: `<div class={\`${sortedMultilineString}\`} />`
            }
          ]
        }
      )
    ).toBeUndefined();
  });

  it("should improve the sorting by grouping all classes with the same modifier together", () => {
    expect(void lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: "<div class=\"c:a a:a b:a a:b c:b b:b\" />",
          htmlOutput: "<div class=\"a:a a:b b:a b:b c:a c:b\" />",
          jsx: "const Test = () => <div class=\"c:a a:a b:a a:b c:b b:b\" />;",
          jsxOutput: "const Test = () => <div class=\"a:a a:b b:a b:b c:a c:b\" />;",
          options: [{ order: "improved" }],
          svelte: "<div class=\"c:a a:a b:a a:b c:b b:b\" />",
          svelteOutput: "<div class=\"a:a a:b b:a b:b c:a c:b\" />",
          vue: "<template><div class=\"c:a a:a b:a a:b c:b b:b\" /></template>",
          vueOutput: "<template><div class=\"a:a a:b b:a b:b c:a c:b\" /></template>"
        }
      ]
    })).toBeUndefined();
  });

  it("should also work in defined call signature arguments", () => {

    const dirtyDefined = "defined('b a d c');";
    const cleanDefined = "defined('a b c d');";
    const dirtyUndefined = "notDefined(\"b a d c\");";

    expect(void lint(
      tailwindSortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            options: [{ callees: ["defined"], order: "asc" }],
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            options: [{ callees: ["defined"], order: "asc" }],
            svelte: `<script>${dirtyUndefined}</script>`,
            vue: `<script>${dirtyUndefined}</script>`
          }
        ]
      }
    )).toBeUndefined();

    expect(void lint(
      tailwindSortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            options: [{ callees: ["/defined/"], order: "asc" }],
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            options: [{ callees: ["/defined/"], order: "asc" }],
            svelte: `<script>${dirtyUndefined}</script>`,
            vue: `<script>${dirtyUndefined}</script>`
          }
        ]
      }
    )).toBeUndefined();

  });

  it("should also work in call signature arguments matched by a regex", () => {

    const dirtyDefined = `defined(
      "b a",
      {
        "nested": {
          "property": "b a",
        },
        "deeply": {
          "nested": {
            "property": "b a",
            "another-property": "b a"
          },
        }
      }
    );`;

    const cleanDefined = `defined(
      "a b",
      {
        "nested": {
          "property": "a b",
        },
        "deeply": {
          "nested": {
            "property": "a b",
            "another-property": "a b"
          },
        }
      }
    );`;

    expect(void lint(
      tailwindSortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 4,
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            options: [{
              callees: [
                ["defined\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
              ],
              order: "asc"
            }]
            // svelte: `<script>${dirtyDefined}</script>`,
            // svelteOutput: `<script>${cleanDefined}</script>`
            // vue: `<script>${dirtyDefined}</script>`,
            // vueOutput: `<script>${cleanDefined}</script>`
          }
        ]
      }
    )).toBeUndefined();

  });


  it("should also work in defined call signature arguments in template literals", () => {

    const dirtyDefined = "${defined('f e')}";
    const cleanDefined = "${defined('e f')}";
    const dirtyUndefined = "${notDefined('f e')}";

    const dirtyDefinedMultiline = `
      b a
      d c ${dirtyDefined} h g
      j i
    `;
    const cleanDefinedMultiline = `
      a b
      c d ${cleanDefined} g h
      i j
    `;
    const dirtyUndefinedMultiline = `
      b a
      d c ${dirtyUndefined} h g
      j i
    `;
    const cleanUndefinedMultiline = `
      a b
      c d ${dirtyUndefined} g h
      i j
    `;

    expect(void lint(
      tailwindSortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 3,
            jsx: `const Test = () => <div class={\`${dirtyDefinedMultiline}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${cleanDefinedMultiline}\`} />;`,
            options: [{ callees: ["defined"], order: "asc" }],
            svelte: `<div class={\`${dirtyDefinedMultiline}\`} />`,
            svelteOutput: `<div class={\`${cleanDefinedMultiline}\`} />`
          },
          {
            errors: 2,
            jsx: `const Test = () => <div class={\`${dirtyUndefinedMultiline}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${cleanUndefinedMultiline}\`} />;`,
            options: [{ callees: ["defined"], order: "asc" }],
            svelte: `<div class={\`${dirtyUndefinedMultiline}\`} />`,
            svelteOutput: `<div class={\`${cleanUndefinedMultiline}\`} />`
          }
        ]
      }
    )).toBeUndefined();

  });

});
