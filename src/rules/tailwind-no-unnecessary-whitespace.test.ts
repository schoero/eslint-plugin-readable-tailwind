import { tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";


describe(`${tailwindNoUnnecessaryWhitespace.name}`, () => {

  it("should trim leading and trailing white space in literals", () => expect(void lint(tailwindNoUnnecessaryWhitespace, {
    invalid: [
      {
        code: tsx`const Test = () => <div class=" b  a " />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="b a" />;`
      },
      {
        code: tsx`const Test = () => <div class=' b  a ' />;`,
        errors: 1,
        output: tsx`const Test = () => <div class='b a' />;`
      },
      {
        code: "const Test = () => <div class={` b  a `} />;",
        errors: 1,
        output: "const Test = () => <div class={`b a`} />;"
      }
    ]
  })).toBeUndefined());


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

    expect(void lint(tailwindNoUnnecessaryWhitespace, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${uncleanedMultilineString}\`} />;`,
          errors: 1,
          output: `const Test = () => <div class={\`${cleanedMultilineString}\`} />;`
        },
        {
          code: `const Test = () => <div class={\`${uncleanedMultilineString}\`} />;`,
          errors: 1,
          options: [{ allowMultiline: false }],
          output: `const Test = () => <div class={\`${cleanedSinglelineString}\`} />;`
        }
      ],
      valid: [
        { code: `const Test = () => <div class={\`${cleanedMultilineString}\`} />;` },
        { code: `const Test = () => <div class={\`${cleanedSinglelineString}\`} />;` }
      ]
    })).toBeUndefined();
  });

  it("should also work in defined call signature arguments", () => {

    const uncleanedNestedCallExpression = tsx`test(" f  e ");`;
    const cleanedNestedCallExpression = tsx`test(" f e ");`;

    const uncleanedMultilineTemplateLiteralWithNestedCallExpression = `
      b  a
      d  c  ${uncleanedNestedCallExpression}  h  g
      j  i
    `;
    const cleanedMultilineTemplateLiteralWithNestedCallExpression = `
      b a
      d c ${cleanedNestedCallExpression} h g
      j i
    `;

    expect(void lint(tailwindNoUnnecessaryWhitespace, {
      invalid: [
        {
          code: tsx`test(" b  a ");`,
          errors: 1,
          options: [{ callees: ["test"] }],
          output: tsx`test("b a");`
        },
        {
          code: `const Test = () => <div class={\`${uncleanedMultilineTemplateLiteralWithNestedCallExpression}\`} />;`,
          errors: 1,
          options: [{ callees: ["test"] }],
          output: `const Test = () => <div class={\`${cleanedMultilineTemplateLiteralWithNestedCallExpression}\`} />;`
        }
      ]
    })).toBeUndefined();
  });

});
