import { describe, it } from "node:test";

import {
  CVA_COMPOUND_VARIANTS_CLASS,
  CVA_STRINGS,
  CVA_VARIANT_VALUES
} from "readable-tailwind:options:callees/cva.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("cva", () => {

  it("should lint strings in arrays", () => {

    const dirty = `cva(" lint ", [" lint ", " lint "])`;
    const clean = `cva("lint", ["lint", "lint"])`;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CVA_STRINGS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
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

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CVA_VARIANT_VALUES] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
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

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CVA_COMPOUND_VARIANTS_CLASS] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
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

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 7,
          jsx: dirty,
          jsxOutput: clean,
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });

  });

});
