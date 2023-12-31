import { tsx } from "src/utils/template.js";
import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";


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
          svelteOutput: "<div class=\"b a\" />"
        }
      ]
    })
  ).toBeUndefined());

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
          svelteOutput: "<div class=\"b a\" />"
        },
        {
          errors: 1,
          html: "<div class='  b  a  ' />",
          htmlOutput: "<div class='b a' />",
          jsx: "const Test = () => <div class='  b  a  ' />;",
          jsxOutput: "const Test = () => <div class='b a' />;",
          svelte: "<div class='  b  a  ' />",
          svelteOutput: "<div class='b a' />"
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
          jsxOutput: "const Test = () => <div class={\"b a\"} />;"
        },
        {
          errors: 1,
          jsx: "const Test = () => <div class={'  b  a  '} />;",
          jsxOutput: "const Test = () => <div class={'b a'} />;"
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
          svelte: `<div class="${uncleanedMultilineString}=" />`,
          svelteOutput: `<div class="${cleanedMultilineString}=" />`
        },
        {
          errors: 1,
          html: `<div class='${uncleanedMultilineString}' />`,
          htmlOutput: `<div class='${cleanedMultilineString}' />`,
          svelte: `<div class='${uncleanedMultilineString}=' />`,
          svelteOutput: `<div class='${cleanedMultilineString}=' />`
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
          options: [{ allowMultiline: false }]
        }
      ],
      valid: [
        { html: `<div class="${cleanedMultilineString}" />`, jsx: `const Test = () => <div class={\`${cleanedMultilineString}\`} />;` },
        { html: `<div class="${cleanedSinglelineString}" />`, jsx: `const Test = () => <div class={\`${cleanedSinglelineString}\`} />;` }
      ]
    })).toBeUndefined();
  });

  it("should also work in defined call signature arguments", () => {

    const dirtyDefined = tsx`defined('  f  e  ');`;
    const cleanDefined = tsx`defined('f e');`;
    const dirtyUndefined = tsx`notDefined("  f  e  ");`;

    expect(void lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `${dirtyDefined}`,
          jsxOutput: `${cleanDefined}`,
          options: [{ callees: ["defined"] }]
        }
      ],
      valid: [
        { jsx: `${dirtyUndefined}` }
      ]
    })).toBeUndefined();

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
          options: [{ callees: ["defined"] }]
        }
      ],
      valid: [
        { jsx: `const Test = () => <div class={\`${dirtyUndefinedMultiline}\`} />;` }
      ]
    })).toBeUndefined();

  });

});
