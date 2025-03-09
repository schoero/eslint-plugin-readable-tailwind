import { describe, it } from "vitest";

import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("jsx", () => {

  it("should match attribute names via regex", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `<img customAttribute="b a" />`,
          jsxOutput: `<img customAttribute="a b" />`,
          options: [{ attributes: [".*Attribute"], order: "asc" }]
        }
      ]
    });
  });

});
