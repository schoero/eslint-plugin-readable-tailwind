import { describe, it } from "vitest";

import { TW_MERGE_STRINGS } from "better-tailwindcss:options:callees/twMerge.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules:no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe("twMerge", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `twMerge(" lint ", [" lint ", " lint "])`;
    const clean = `twMerge("lint", ["lint", "lint"])`;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
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
