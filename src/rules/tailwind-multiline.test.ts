import { createTrimTag } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { tailwindMultiline } from "eptm:rules:tailwind-multiline.js";


describe(`${tailwindMultiline.name}`, () => {

  it("should not wrap short lines", () => {
    expect(void lint(tailwindMultiline, {
      valid: [
        { code: "const Test = () => <div class={`a b c`} />;" },
        { code: "const Test = () => <div class='a b c' />;" },
        { code: "const Test = () => <div class=\"a b c\" />;" }
      ]
    })).toBeUndefined();
  });

  it("should wrap long lines on to multiple lines", () => {

    const trim = createTrimTag(4);

    const singleLine = " a b c d e f g h ";
    const multiline = trim`
      a b c
      d e f
      g h
    `;

    expect(void lint(tailwindMultiline, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${singleLine}\`} />;`,
          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${multiline}\`} />;`
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

    expect(void lint(tailwindMultiline, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${singleLineWithExpressionAtBeginning}\`} />;`,
          errors: 2,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${multilineWithExpressionAtBeginning}\`} />;`
        },
        {
          code: `const Test = () => <div class={\`${singleLineWithExpressionAtEnd}\`} />;`,
          errors: 2,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${multilineWithExpressionAtEnd}\`} />;`
        },
        {
          code: `const Test = () => <div class={\`${singleLineWithExpressionInCenter}\`} />;`,
          errors: 2,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${multilineWithExpressionInCenter}\`} />;`
        },
        {
          code: `const Test = () => <div class={\`${singleLineWithClassesAroundExpression}\`} />;`,
          errors: 2,
          options: [{ classesPerLine: 4, indent: 2 }],
          output: `const Test = () => <div class={\`${multilineWithClassesAroundExpression}\`} />;`
        }
      ]
    })).toBeUndefined();

  });

  it("should group correctly", () => {

    const trim = createTrimTag(4);

    const singleLine = "g-1:a g-1:b g-2:a g-2:b g-3:a g-3:b";
    const multiline = trim`
      g-1:a g-1:b

      g-2:a g-2:b

      g-3:a g-3:b
    `;

    expect(void lint(tailwindMultiline, {
      invalid: [
        {
          code: `const Test = () => <div class={\`${singleLine}\`} />;`,
          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }],
          output: `const Test = () => <div class={\`${multiline}\`} />;`
        }
      ]
    })).toBeUndefined();

  });

});
