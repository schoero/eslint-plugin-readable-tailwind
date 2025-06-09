import { describe, it } from "vitest";

import { sortClasses } from "better-tailwindcss:rules/sort-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("jsx", () => {
  it("should match attribute names via regex", () => {
    lint(sortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `<img customAttribute="b a" />`,
          jsxOutput: `<img customAttribute="a b" />`,

          errors: 1,
          options: [{ attributes: [".*Attribute"], order: "asc" }]
        }
      ]
    });
  });
});


describe("astro (jsx)", () => {
  it("should match astro syntactic sugar", () => {
    lint(sortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          astro: `<img class:list="b a" />`,
          astroOutput: `<img class:list="a b" />`,

          errors: 1,
          options: [{ order: "asc" }]
        }
      ]
    });
  });
});
