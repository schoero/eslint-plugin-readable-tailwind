import { describe, it } from "vitest";

import {
  CVA_COMPOUND_VARIANTS_CLASS,
  CVA_STRINGS,
  CVA_VARIANT_VALUES
} from "better-tailwindcss:options/callees/cva.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("cva", () => {

  it("should lint strings in arrays", () => {

    const dirty = `cva(" lint ", [" lint ", " lint "])`;
    const clean = `cva("lint", ["lint", "lint"])`;

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
          options: [{ callees: [CVA_STRINGS] }]
        }
      ]
    });

  });

  it("should lint object values inside the `variants` property", () => {

    const dirty = `
      cva(" ignore ", {
          variants: { " ignore ": " lint " },
          compoundVariants: { " ignore ": " ignore " }
        }
      )
    `;
    const clean = `
      cva(" ignore ", {
          variants: { " ignore ": "lint" },
          compoundVariants: { " ignore ": " ignore " }
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

          errors: 1,
          options: [{ callees: [CVA_VARIANT_VALUES] }]
        }
      ]
    });
  });

  it("should lint only object values inside the `compoundVariants.class` and `compoundVariants.className` property", () => {

    const dirty = `
      cva(" ignore ", {
          variants: { " ignore ": " ignore " },
          compoundVariants: [{ 
            " ignore ": " ignore ",
            "class": " lint ",
            "className": " lint "
          }]
        }
      )
    `;
    const clean = `
      cva(" ignore ", {
          variants: { " ignore ": " ignore " },
          compoundVariants: [{ 
            " ignore ": " ignore ",
            "class": "lint",
            "className": "lint"
          }]
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
          options: [{ callees: [CVA_COMPOUND_VARIANTS_CLASS] }]
        }
      ]
    });

  });

  it("should lint all `cva` variations in combination by default", () => {
    const dirty = `
      cva([" lint ", " lint "], " lint ", {
        compoundVariants: [
          {
            " ignore ": " ignore ",
            "class": " lint "
          }
        ],
        defaultVariants: {
          " ignore ": " ignore "
        },
        variants: {
          " ignore ": {
            " ignore array ": [
              " lint ",
              " lint "
            ],
            " ignore string ": " lint "
          }
        }
      });
    `;

    const clean = `
      cva(["lint", "lint"], "lint", {
        compoundVariants: [
          {
            " ignore ": " ignore ",
            "class": "lint"
          }
        ],
        defaultVariants: {
          " ignore ": " ignore "
        },
        variants: {
          " ignore ": {
            " ignore array ": [
              "lint",
              "lint"
            ],
            " ignore string ": "lint"
          }
        }
      });
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

          errors: 7
        }
      ]
    });

  });

});
