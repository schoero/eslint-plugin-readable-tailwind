import { tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindMultiline } from "eptm:rules:tailwind-multiline.js";


describe(`${tailwindMultiline.name}`, () => {

  it("should wrap long lines on to multiple lines", () => {

    const fixedMultilineStringLiteral = `
      a b c
      d e f
      g h
    `;

    expect(void lint(tailwindMultiline, {
      invalid: [
        {
          code: tsx`const Test = () => <div class=" a b c d e f g h " />;`,
          errors: 1,
          options: [{ classesPerLine: 3 }],
          output: `const Test = () => <div class={\`${fixedMultilineStringLiteral}\`} />;`
        }
      ]
    })).toBeUndefined();
  });

});
