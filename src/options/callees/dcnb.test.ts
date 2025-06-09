import { describe, it } from "vitest";

import { DCNB_OBJECT_KEYS, DCNB_STRINGS } from "better-tailwindcss:options/callees/dcnb.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("dcnb", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `dcnb(" lint ", [" lint ", " lint "])`;
    const clean = `dcnb("lint", ["lint", "lint"])`;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: dirty,
          jsxOutput: clean,
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`,

          errors: 3,
          options: [{ callees: [DCNB_STRINGS] }]
        }
      ]
    });

  });

  it("should lint object keys", () => {

    const dirty = `
      dcnb(" ignore ", {
          " lint ": { " lint ": " ignore " },
        }
      )
    `;
    const clean = `
      dcnb(" ignore ", {
          "lint": { "lint": " ignore " },
        }
      )
    `;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: dirty,
          jsxOutput: clean,
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`,

          errors: 2,
          options: [{ callees: [DCNB_OBJECT_KEYS] }]
        }
      ]
    });
  });

});
