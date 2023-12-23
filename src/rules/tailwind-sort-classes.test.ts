import { } from "src/utils/template.js";
import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindSortClasses } from "eptm:rules:tailwind-sort-classes.js";


describe(tailwindSortClasses.name, () => {

  it("should sort simple class names as defined", () => expect(
    void lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: "<div class='b a' />",
          htmlOutput: "<div class='a b' />",
          jsx: "const Test = () => <div class=\"b a\" />;",
          jsxOutput: "const Test = () => <div class=\"a b\" />;",
          options: [{ order: "asc" }]
        },
        {
          errors: 1,
          html: "<div class='a b' />",
          htmlOutput: "<div class='b a' />",
          jsx: "const Test = () => <div class=\"a b\" />;",
          jsxOutput: "const Test = () => <div class=\"b a\" />;",
          options: [{ order: "desc" }]
        },
        {
          errors: 1,
          html: "<div class='w-full absolute' />",
          htmlOutput: "<div class='absolute w-full' />",
          jsx: "const Test = () => <div class=\"w-full absolute\" />;",
          jsxOutput: "const Test = () => <div class=\"absolute w-full\" />;",
          options: [{ order: "official" }]
        }
      ],
      valid: [
        { html: "<div class=\"a b\" />", jsx: "const Test = () => <div class=\"a b\" />;", options: [{ order: "asc" }] },
        { html: "div class=\"b a\" />", jsx: "const Test = () => <div class=\"b a\" />;", options: [{ order: "desc" }] },
        { html: "<div class=\"absolute w-full\" />", jsx: "const Test = () => <div class=\"absolute w-full\" />;", options: [{ order: "official" }] }
      ]
    })
  ).toBeUndefined());

  it("should keep expressions as they are", () => expect(
    void lint(tailwindSortClasses, TEST_SYNTAXES, {
      valid: [
        { jsx: "const Test = () => <div class={true ? \"a\" : \"b\"} />;" }
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
          options: [{ order: "asc" }]
        }
      ],
      valid: [
        { jsx: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b `} />;" }
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

    expect(void lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<div class="${unsortedMultilineString}" />`,
          htmlOutput: `<div class="${sortedMultilineString}" />`,
          jsx: `const Test = () => <div class={\`${unsortedMultilineString}\`} />;`,
          jsxOutput: `const Test = () => <div class={\`${sortedMultilineString}\`} />;`,
          options: [{ order: "asc" }]
        }
      ],
      valid: [
        { html: `<div class="${sortedMultilineString}" />`, jsx: `const Test = () => <div class={\`${sortedMultilineString}\`} />;`, options: [{ order: "asc" }] }
      ]
    })).toBeUndefined();
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
          options: [{ order: "improved" }]
        }
      ]
    })).toBeUndefined();
  });

});
