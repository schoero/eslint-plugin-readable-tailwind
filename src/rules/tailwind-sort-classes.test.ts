import { tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindSortClasses } from "eptm:rules:tailwind-sort-classes.js";


describe(`${tailwindSortClasses.name}`, () => {

  it("should sort simple class names alphabetically", () => expect(void lint(tailwindSortClasses, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="b a" />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="a b" />;`
      }
    ],
    valid: [
      { code: tsx`const Test = () => <div class="a b" />;` }
    ]
  })).toBeUndefined());

  it("should sort class names with modifiers alphabetically", () => expect(void lint(tailwindSortClasses, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="b:class a:class" />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="a:class b:class" />;`
      }
    ],
    valid: [
      { code: tsx`const Test = () => <div class="a:class b:class" />;` }
    ]
  })).toBeUndefined());

  it("should keep expressions as they are", () => expect(void lint(tailwindSortClasses, {
    valid: [
      { code: tsx`const Test = () => <div class={true ? "a" : "b"} />;` }
    ]
  })).toBeUndefined());

  it("should keep expressions where they are", () => expect(void lint(tailwindSortClasses, {
    invalid: [
      {
        code: "const Test = () => <div class={`c a ${true ? 'e' : 'f'} b `} />;",
        errors: 1,
        output: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b `} />;"
      }
    ],
    valid: [
      { code: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b `} />;" }
    ]
  })).toBeUndefined());

  it("should sort multiline strings but keep the whitespace", () => {
    const unsortedMultilineString = `
      d c
      b a
    `;

    const sortedMultilineString = `
      a b
      c d
    `;

    expect(void lint(tailwindSortClasses, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${unsortedMultilineString}\`} />;`,
          errors: 1,
          output: `const Test = () => <div class={\`${sortedMultilineString}\`} />;`
        }
      ],
      valid: [
        { code: `const Test = () => <div class={\`${sortedMultilineString}\`} />;` }
      ]
    })).toBeUndefined();
  });

});
