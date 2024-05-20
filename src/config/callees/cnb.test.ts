import { describe, it } from "node:test";

import { lint, TEST_SYNTAXES } from "tests/utils.js";

import { CNB_OBJECT_KEYS, CNB_STRINGS } from "readable-tailwind:config:callees/cnb.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe("cnb", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `cnb(" lint ", [" lint ", " lint "])`;
    const clean = `cnb("lint", ["lint", "lint"])`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CNB_STRINGS] }],
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
      cnb(" ignore ", {
          " lint ": { " lint ": " ignore " },
        }
      )
    `;
    const clean = `
      cnb(" ignore ", {
          "lint": { "lint": " ignore " },
        }
      )
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CNB_OBJECT_KEYS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });
  });

});
