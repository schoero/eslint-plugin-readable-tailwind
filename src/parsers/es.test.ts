import { describe, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("es", () => {

  it("should match callees names via regex", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `testStyles(" lint ");`,
          jsxOutput: `testStyles("lint");`,
          options: [{
            callees: ["^.*Styles$"]
          }],
          svelte: `<script>testStyles(" lint ");</script>`,
          svelteOutput: `<script>testStyles("lint");</script>`,
          vue: `<script>testStyles(" lint ");</script>`,
          vueOutput: `<script>testStyles("lint");</script>`
        }
      ]
    });
  });

  it("should match variable names via regex", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `const testStyles = " lint ";`,
          jsxOutput: `const testStyles = "lint";`,
          options: [{
            variables: ["^.*Styles$"]
          }],
          svelte: `<script>const testStyles = " lint ";</script>`,
          svelteOutput: `<script>const testStyles = "lint";</script>`,
          vue: `<script>const testStyles = " lint ";</script>`,
          vueOutput: `<script>const testStyles = "lint";</script>`
        }
      ]
    });
  });

  it("should match classAttributes via regex", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: `<img testStyles=" lint " />`,
          jsxOutput: `<img testStyles="lint" />`,
          options: [{
            classAttributes: ["^.*Styles$"]
          }],
          svelte: `<img testStyles=" lint " />`,
          svelteOutput: `<img testStyles="lint" />`,
          vue: `<template><img testStyles=" lint " /> </template>`,
          vueOutput: `<template><img testStyles="lint" /> </template>`
        }
      ]
    });
  });

});
