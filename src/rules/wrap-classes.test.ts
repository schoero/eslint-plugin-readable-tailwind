import { RuleTester } from "eslint";
import { tsx } from "src/utils/template.js";
import { describe, expect, it } from "vitest";

import wrapClassesRule from "eptm:rules/wrap-classes.js";


const ruleTester = new RuleTester({
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2015 }
});

describe("wrap-classes", () => {

  it("should pass", () => {
    expect(
      void ruleTester.run(
        "wrap-classes",
        wrapClassesRule,
        {
          invalid: [{
            code: tsx`
              const foo = () => <div class="before:test after:test">Test</div>;
            `,
            errors: 1,
            output: tsx`
              const foo = () => <div class="after:test before:test">Test</div>;
            `
          }],
          valid: [{
            code: tsx`
              const foo = () => <div class="after:test before:test">Test</div>;
            `
          }]
        }
      )
    ).toBeUndefined();

  });

});
