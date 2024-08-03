import { describe, it } from "vitest";

import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe(tailwindSortClasses.name, () => {

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
