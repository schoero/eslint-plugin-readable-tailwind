import { createTrimTag, tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindMultiline } from "eptm:rules:tailwind-multiline.js";


describe(`${tailwindMultiline.name}`, () => {


  it("should wrap long lines on to multiple lines", () => {

    const trim = createTrimTag(4);

    const fixedMultilineStringLiteral = trim`
      a b c
      d e f
      g h
    `;

    expect(void lint(tailwindMultiline, {
      invalid: [
        {
          code: tsx`const Test = () => <div class=" a b c d e f g h " />;`,
          errors: 2,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${fixedMultilineStringLiteral}\`} />;`
        }
      ]
    })).toBeUndefined();
  });

  it("should wrap expressions correctly", () => {

    const trim = createTrimTag(4);

    const expression = "${true ? ' true ' : ' false '}";

    const invalidStringLiteralWithExpressionAtBeginning = `${expression} a b c d e f g h `;
    const fixedMultilineStringLiteralWithExpressionAtBeginning = trim`
      ${expression}
      a b c
      d e f
      g h
    `;

    expect(void lint(tailwindMultiline, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${invalidStringLiteralWithExpressionAtBeginning}\`} />;`,
          errors: 2,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${fixedMultilineStringLiteralWithExpressionAtBeginning}\`} />;`
        }
      ]
    })).toBeUndefined();
  });

});
