import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "vitest";

import { OBJSTR_OBJECT_KEYS } from "readable-tailwind:config:callees/objstr.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe("objstr", () => {

  it("should lint object keys", () => {

    const dirty = `
      objstr(" ignore ", {
          " lint ": { " lint ": " ignore " },
        }
      )
    `;
    const clean = `
      objstr(" ignore ", {
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
          options: [{ callees: [OBJSTR_OBJECT_KEYS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });
  });

});
