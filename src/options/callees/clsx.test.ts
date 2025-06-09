import { describe, it } from "vitest";

import { CLSX_OBJECT_KEYS, CLSX_STRINGS } from "better-tailwindcss:options/callees/clsx.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("clsx", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `clsx(" lint ", [" lint ", " lint "])`;
    const clean = `clsx("lint", ["lint", "lint"])`;

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
          options: [{ callees: [CLSX_STRINGS] }]
        }
      ]
    });

  });

  it("should lint object keys", () => {

    const dirty = `
      clsx(" ignore ", {
          " lint ": { " lint ": " ignore " },
        }
      )
    `;
    const clean = `
      clsx(" ignore ", {
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
          options: [{ callees: [CLSX_OBJECT_KEYS] }]
        }
      ]
    });
  });

});
