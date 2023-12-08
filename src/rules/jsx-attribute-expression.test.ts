import { tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import jsxNoAttributeExpression from "eptm:rules:jsx-attribute-expression.js";


describe("jsx-attribute-expression", () => {

  it("should not allow useless attribute expressions by default", () => expect(void lint("jsx-attribute-expression", jsxNoAttributeExpression, {
    invalid: [
      {
        code: tsx`const Test = () => <div class={"class"} />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="class" />;`
      },
      {
        code: tsx`const Test = () => <div class={'class'} />;`,
        errors: 1,
        output: tsx`const Test = () => <div class='class' />;`
      },
      {
        code: "const Test = () => <div class={`class`} />;",
        errors: 1,
        output: tsx`const Test = () => <div class="class" />;`
      }
    ]
  })).toBeUndefined());

  it("should not change useful attribute expressions by default", () => expect(void lint("jsx-attribute-expression", jsxNoAttributeExpression, {
    valid: [
      {
        code: tsx`const Test = () => <div class={"class" + " other " + " class"} />;`
      },
      {
        code: tsx`const Test = () => <div class={'class' + ' other ' + ' class'} />;`
      },
      {
        code: "const Test = () => <div class={`class ${true ? 'other' : 'class'}`} />;"
      }
    ]
  })).toBeUndefined());

  it("should not change multiline template literal strings", () => {

    const multilineTemplateLiteral = `
      class
      other
      class
    `;

    expect(void lint("jsx-attribute-expression", jsxNoAttributeExpression, {
      valid: [
        {
          code: `const Test = () => <div class={\`${multilineTemplateLiteral}\`} />;`
        }
      ]
    })).toBeUndefined();

  });

  it("should allow useless attribute expressions if preferred", () => expect(void lint("jsx-attribute-expression", jsxNoAttributeExpression, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="class" />;`,
        errors: 1,
        options: ["always"],
        output: tsx`const Test = () => <div class={"class"} />;`
      },
      {
        code: tsx`const Test = () => <div class='class' />;`,
        errors: 1,
        options: ["always"],
        output: tsx`const Test = () => <div class={'class'} />;`
      }
    ],
    valid: [{
      code: "const Test = () => <div class={`class`} />;",
      options: ["always"]
    }]
  })).toBeUndefined());


});
