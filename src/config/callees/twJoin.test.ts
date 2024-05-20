import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "node:test";

import { TW_JOIN_STRINGS } from "readable-tailwind:config:callees/twJoin.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe("twJoin", () => {

  it("should lint strings and strings in arrays", () => {

    const dirty = `twJoin(" lint ", [" lint ", " lint "])`;
    const clean = `twJoin("lint", ["lint", "lint"])`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [TW_JOIN_STRINGS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });

  });

});
