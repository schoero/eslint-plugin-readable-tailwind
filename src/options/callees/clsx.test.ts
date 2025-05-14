import { describe, it } from "vitest";

import { CLSX_OBJECT_KEYS, CLSX_STRINGS } from "better-tailwindcss:options:callees/clsx.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe("clsx", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `clsx(" lint ", [" lint ", " lint "])`;
    const clean = `clsx("lint", ["lint", "lint"])`;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CLSX_STRINGS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
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
          errors: 2,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CLSX_OBJECT_KEYS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });
  });

});
