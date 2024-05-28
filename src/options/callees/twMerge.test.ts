import { describe, it } from "node:test";

import { TW_MERGE_STRINGS } from "readable-tailwind:options:callees/twMerge.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("twMerge", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `twMerge(" lint ", [" lint ", " lint "])`;
    const clean = `twMerge("lint", ["lint", "lint"])`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [TW_MERGE_STRINGS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });

  });

});
