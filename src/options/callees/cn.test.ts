import { describe, it } from "vitest";

import { CN_OBJECT_KEYS, CN_STRINGS } from "better-tailwindcss:options:callees/cn.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe("cn", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `cn(" lint ", [" lint ", " lint "])`;
    const clean = `cn("lint", ["lint", "lint"])`;

    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CN_STRINGS] }],
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
      cn(" ignore ", {
          " lint ": { " lint ": " ignore " },
        }
      )
    `;
    const clean = `
      cn(" ignore ", {
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
          options: [{ callees: [CN_OBJECT_KEYS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });
  });

});
