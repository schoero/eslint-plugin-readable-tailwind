import { tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "eptm:rules:tailwind-no-unnecessary-whitespace.js";


describe(`${tailwindNoUnnecessaryWhitespace.name}`, () => {

  it("should trim leading and trailing white space in literals", () => expect(void lint(tailwindNoUnnecessaryWhitespace, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="  b  a  " />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="b a" />;`
      },
      {
        code: tsx`const Test = () => <div class='  b  a  ' />;`,
        errors: 1,
        output: tsx`const Test = () => <div class='b a' />;`
      },
      {
        code: "const Test = () => <div class={`  b  a  `} />;",
        errors: 1,
        output: "const Test = () => <div class={`b a`} />;"
      }
    ]
  })).toBeUndefined());

  it("should keep one whitespace around template elements", () => expect(void lint(tailwindNoUnnecessaryWhitespace, {
    invalid: [
      {
        code: "const Test = () => <div class={`  b  a  ${'  c  '}  d  `} />;",
        errors: 2,
        output: "const Test = () => <div class={`b a ${'  c  '} d`} />;"
      }
    ]
  })).toBeUndefined());

  it("should remove whitespace around template elements if they are at the beginning or end", () => expect(void lint(tailwindNoUnnecessaryWhitespace, {
    invalid: [
      {
        code: "const Test = () => <div class={`  ${' b '}  a  d  ${'  c  '}  `} />;",
        errors: 3,
        output: "const Test = () => <div class={`${' b '} a d ${'  c  '}`} />;"
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

    const dirtyDefined = tsx`defined('  f  e  ');`;
    const cleanDefined = tsx`defined('f e');`;
    const dirtyUndefined = tsx`notDefined("  f  e  ");`;

    expect(void lint(tailwindNoUnnecessaryWhitespace, {
      invalid: [
        {
          code: `${dirtyDefined}`,
          errors: 1,
          options: [{ callees: ["defined"] }],
          output: `${cleanDefined}`
        }
      ],
      valid: [
        { code: `${dirtyUndefined}` }
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

    expect(void lint(tailwindNoUnnecessaryWhitespace, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${dirtyDefinedMultiline}\`} />;`,
          errors: 1,
          options: [{ callees: ["defined"] }],
          output: `const Test = () => <div class={\`${cleanDefinedMultiline}\`} />;`
        }
      ],
      valid: [
        { code: `const Test = () => <div class={\`${dirtyUndefinedMultiline}\`} />;` }
      ]
    })).toBeUndefined();

  });

});
