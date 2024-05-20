import { describe, it } from "node:test";

import { CX_OBJECT_KEYS, CX_STRINGS } from "readable-tailwind:config:callees/cx.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("cx", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `cx(" lint ", [" lint ", " lint "])`;
    const clean = `cx("lint", ["lint", "lint"])`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CX_STRINGS] }],
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
      cx(" ignore ", {
          " lint ": { " lint ": " ignore " },
        }
      )
    `;
    const clean = `
      cx(" ignore ", {
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
          options: [{ callees: [CX_OBJECT_KEYS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });
  });

});
