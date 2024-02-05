import { createTrimTag } from "tests/utils";
import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindMultiline } from "readable-tailwind:rules:tailwind-multiline.js";


describe(tailwindMultiline.name, () => {

  it("should not wrap short lines", () => {
    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        valid: [
          {
            html: "<div class=\"a b c\" />",
            jsx: "const Test = () => <div class=\"a b c\" />;",
            svelte: "<div class=\"a b c\" />",
            vue: "<template><div class=\"a b c\" /></template>"
          },
          {
            html: "<div class='a b c' />",
            jsx: "const Test = () => <div class='a b c' />;",
            svelte: "<div class='a b c' />",
            vue: "<template><div class='a b c' /></template>"
          },
          {
            jsx: "const Test = () => <div class={\"a b c\"} />;",
            svelte: "<div class={\"a b c\"} />"
          },
          {
            jsx: "const Test = () => <div class={'a b c'} />;",
            svelte: "<div class={'a b c'} />"
          },
          {
            jsx: "const Test = () => <div class={`a b c`} />;",
            svelte: "<div class={`a b c`} />"
          }
        ]
      }
    )).toBeUndefined();
  });

  it("should include previous characters to decide if lines should be wrapped", () => {

    const trim = createTrimTag(4);

    const dirty = "this string literal is exactly 54 characters in length";
    const clean = trim`
      this string literal is exactly 54 characters in length
    `;

    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<div class="${dirty}" />`,
            htmlOutput: `<div class="${clean}" />`,
            jsx: `const Test = () => <div class="${dirty}" />;`,
            jsxOutput: `const Test = () => <div class={\`${clean}\`} />;`,
            options: [{ printWidth: 60 }],
            svelte: `<div class="${dirty}" />`,
            svelteOutput: `<div class="${clean}" />`,
            vue: `<template><div class="${dirty}" /></template>`,
            vueOutput: `<template><div class="${clean}" /></template>`
          }
        ]
      }
    )).toBeUndefined();
  });

  it("should disable the `printWidth` limit when set to `0`", () => {
    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        valid: [
          {
            html: "<div class=\"this string literal is longer than 80 characters and would be wrapped using the default printWidth\" />",
            jsx: "const Test = () => <div class=\"this string literal is longer than 80 characters and would be wrapped using the default printWidth\" />;",
            options: [{ printWidth: 0 }],
            svelte: "<div class=\"this string literal is longer than 80 characters and would be wrapped using the default printWidth\" />",
            vue: "<template><div class=\"this string literal is longer than 80 characters and would be wrapped using the default printWidth\" /></template>"
          }
        ]
      }
    )).toBeUndefined();
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

    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: `const Test = () => <div class={${dirtyDefined}} />;`,
            jsxOutput: `const Test = () => <div class={${cleanDefined}} />;`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<div class={${dirtyDefined}} />`,
            svelteOutput: `<div class={${cleanDefined}} />`
          }
        ],
        valid: [
          {
            jsx: `const Test = () => <div class={${dirtyUndefined}} />;`,
            options: [{ callees: ["defined"], classesPerLine: 3, indent: 2 }],
            svelte: `<div class={${dirtyUndefined}} />`
          }
        ]
      }
    )).toBeUndefined();
  });

  it("should change to a jsx expression correctly", () => {

    const trim = createTrimTag(4);

    const singleLine = " a b c d e f g h ";
    const multiline = trim`
      a b c
      d e f
      g h
    `;

    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            jsx: `const Test = () => <div class="${singleLine}" />;`,
            jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            errors: 1,
            jsx: `const Test = () => <div class='${singleLine}' />;`,
            jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }]
          },
          {
            errors: 1,
            jsx: `const Test = () => <div class={"${singleLine}"} />;`,
            jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<div class={"${singleLine}"} />`,
            svelteOutput: `<div class={\`${multiline}\`} />`
          },
          {
            errors: 1,
            jsx: `const Test = () => <div class={'${singleLine}'} />;`,
            jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<div class={'${singleLine}'} />`,
            svelteOutput: `<div class={\`${multiline}\`} />`
          }
        ],
        valid: [
          {
            jsx: `const Test = () => <div class={\`${multiline}\`} />;`,
            svelte: `<div class={\`${multiline}\`} />`
          },
          {
            html: `<div class="${multiline}" />`,
            svelte: `<div class="${multiline}" />`
          },
          {
            html: `<div class='${multiline}' />`,
            svelte: `<div class='${multiline}' />`
          }
        ]
      }
    )).toBeUndefined();
  });

  it("should wrap long lines on to multiple lines", () => {

    const trim = createTrimTag(4);

    const singleLine = " a b c d e f g h ";
    const multiline = trim`
      a b c
      d e f
      g h
    `;

    expect(void lint(tailwindMultiline, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<div class="${singleLine}" />`,
          htmlOutput: `<div class="${multiline}" />`,
          jsx: `const Test = () => <div class="${singleLine}" />;`,
          jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<div class="${singleLine}" />`,
          svelteOutput: `<div class="${multiline}" />`,
          vue: `<template><div class="${singleLine}" /></template>`,
          vueOutput: `<template><div class="${multiline}" /></template>`
        },
        {
          errors: 1,
          html: `<div class='${singleLine}' />`,
          htmlOutput: `<div class='${multiline}' />`,
          jsx: `const Test = () => <div class='${singleLine}' />;`,
          jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<div class='${singleLine}' />`,
          svelteOutput: `<div class='${multiline}' />`,
          vue: `<template><div class='${singleLine}' /></template>`,
          vueOutput: `<template><div class='${multiline}' /></template>`
        },
        {
          errors: 1,
          jsx: `const Test = () => <div class={\`${singleLine}\`} />;`,
          jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<div class={\`${singleLine}\`} />`,
          svelteOutput: `<div class={\`${multiline}\`} />`
        },
        {
          errors: 1,
          jsx: `const Test = () => <div class={"${singleLine}"} />;`,
          jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<div class={"${singleLine}"} />`,
          svelteOutput: `<div class={\`${multiline}\`} />`
        },
        {
          errors: 1,
          jsx: `const Test = () => <div class={'${singleLine}'} />;`,
          jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
          options: [{ classesPerLine: 3, indent: 2 }],
          svelte: `<div class={'${singleLine}'} />`,
          svelteOutput: `<div class={\`${multiline}\`} />`
        }
      ]
    })).toBeUndefined();
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

    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 2,
            jsx: `const Test = () => <div class={\`${singleLineWithExpressionAtBeginning}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${multilineWithExpressionAtBeginning}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<div class={\`${singleLineWithExpressionAtBeginning}\`} />`,
            svelteOutput: `<div class={\`${multilineWithExpressionAtBeginning}\`} />`
          },
          {
            errors: 2,
            jsx: `const Test = () => <div class={\`${singleLineWithExpressionInCenter}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${multilineWithExpressionInCenter}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<div class={\`${singleLineWithExpressionInCenter}\`} />`,
            svelteOutput: `<div class={\`${multilineWithExpressionInCenter}\`} />`
          },
          {
            errors: 2,
            jsx: `const Test = () => <div class={\`${singleLineWithExpressionAtEnd}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${multilineWithExpressionAtEnd}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<div class={\`${singleLineWithExpressionAtEnd}\`} />`,
            svelteOutput: `<div class={\`${multilineWithExpressionAtEnd}\`} />`
          },
          {
            errors: 2,
            jsx: `const Test = () => <div class={\`${singleLineWithClassesAroundExpression}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${multilineWithClassesAroundExpression}\`} />;`,
            options: [{ classesPerLine: 4, indent: 2 }],
            svelte: `<div class={\`${singleLineWithClassesAroundExpression}\`} />`,
            svelteOutput: `<div class={\`${multilineWithClassesAroundExpression}\`} />`
          }
        ]
      }
    )).toBeUndefined();

  });

  it("should group correctly", () => {

    const trim = createTrimTag(4);

    const singleLine = "g-1:a g-1:b g-2:a g-2:b g-3:a g-3:b";
    const multiline = trim`
      g-1:a g-1:b

      g-2:a g-2:b

      g-3:a g-3:b
    `;

    expect(void lint(
      tailwindMultiline,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            errors: 1,
            html: `<div class="${singleLine}" />`,
            htmlOutput: `<div class="${multiline}" />`,
            jsx: `const Test = () => <div class={\`${singleLine}\`} />;`,
            jsxOutput: `const Test = () => <div class={\`${multiline}\`} />;`,
            options: [{ classesPerLine: 3, indent: 2 }],
            svelte: `<div class="${singleLine}" />`,
            svelteOutput: `<div class="${multiline}" />`,
            vue: `<template><div class="${singleLine}" /></template>`,
            vueOutput: `<template><div class="${multiline}" /></template>`
          }
        ]
      }
    )).toBeUndefined();

  });

});
