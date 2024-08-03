import { describe, it } from "vitest";

import { CTL_STRINGS } from "readable-tailwind:options:callees/ctl.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("ctl", () => {

  it("should lint strings", () => {

    const dirty = `ctl(" lint ")`;
    const clean = `ctl("lint")`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CTL_STRINGS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });

  });

});
