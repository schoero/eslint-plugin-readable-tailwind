import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "node:test";

import {
  CLB_BASE_VALUES,
  CLB_COMPOUND_VARIANTS_CLASSES,
  CLB_VARIANT_VALUES
} from "readable-tailwind:config:callees/clb.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


describe("clb", () => {

  it("should lint object values inside the `base` property", () => {

    const dirty = `
      clb({
          base: " lint ",
          " ignore ": " ignore "
        }
      )
    `;
    const clean = `
      clb({
          base: "lint",
          " ignore ": " ignore "
        }
      )
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CLB_BASE_VALUES] }],
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
      clb({
          variants: { " ignore ": " lint " },
          compoundVariants: { " ignore ": " ignore " }
        }
      )
    `;
    const clean = `
      clb({
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
          options: [{ callees: [CLB_VARIANT_VALUES] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });

  });

  it("should lint only object values inside the `compoundVariants.classes` property", () => {

    const dirty = `
      clb({
          variants: { " ignore ": " ignore " },
          compoundVariants: [{ 
            " ignore ": " ignore ",
            "classes": " lint "
          }]
        }
      )
    `;
    const clean = `
      clb({
          variants: { " ignore ": " ignore " },
          compoundVariants: [{ 
            " ignore ": " ignore ",
            "classes": "lint"
          }]
        }
      )
    `;

    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: dirty,
          jsxOutput: clean,
          options: [{ callees: [CLB_COMPOUND_VARIANTS_CLASSES] }],
          svelte: `<script>${dirty}</script>`,
          svelteOutput: `<script>${clean}</script>`,
          vue: `<script>${dirty}</script>`,
          vueOutput: `<script>${clean}</script>`
        }
      ]
    });

  });

  it("should lint all `clb` variations in combination by default", () => {
    const dirty = `
      clb({
        base: " lint ",
        compoundVariants: [
          {
            " ignore ": " ignore ",
            "classes": " lint "
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
      clb({
        base: "lint",
        compoundVariants: [
          {
            " ignore ": " ignore ",
            "classes": "lint"
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
          errors: 5,
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
