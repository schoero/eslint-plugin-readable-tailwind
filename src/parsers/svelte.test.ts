import { describe, it } from "vitest";

import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("svelte", () => {

  it("should match attribute names via regex", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ attributes: [".*Attribute"], order: "asc" }],
          svelte: `<img customAttribute="b a" />`,
          svelteOutput: `<img customAttribute="a b" />`
        }
      ]
    });
  });

  // #42
  it("should work with shorthand attributes", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ order: "asc" }],
          svelte: `<script>let disabled = true;</script><img class="c b a" {disabled} />`,
          svelteOutput: `<script>let disabled = true;</script><img class="a b c" {disabled} />`
        }
      ]
    });
  });

});
