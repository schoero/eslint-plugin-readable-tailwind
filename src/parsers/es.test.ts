import { describe, it } from "vitest";

import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("es", () => {

  it("should match callees names via regex", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `testStyles(" lint ");`,
          jsxOutput: `testStyles("lint");`,
          svelte: `<script>testStyles(" lint ");</script>`,
          svelteOutput: `<script>testStyles("lint");</script>`,
          vue: `<script>testStyles(" lint ");</script>`,
          vueOutput: `<script>testStyles("lint");</script>`,

          errors: 1,
          options: [{
            callees: ["^.*Styles$"]
          }]
        }
      ]
    });
  });

  it("should match variable names via regex", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `const testStyles = " lint ";`,
          jsxOutput: `const testStyles = "lint";`,
          svelte: `<script>const testStyles = " lint ";</script>`,
          svelteOutput: `<script>const testStyles = "lint";</script>`,
          vue: `<script>const testStyles = " lint ";</script>`,
          vueOutput: `<script>const testStyles = "lint";</script>`,

          errors: 1,
          options: [{
            variables: ["^.*Styles$"]
          }]
        }
      ]
    });
  });

  it("should match attributes via regex", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: `<img testStyles=" lint " />`,
          jsxOutput: `<img testStyles="lint" />`,
          svelte: `<img testStyles=" lint " />`,
          svelteOutput: `<img testStyles="lint" />`,
          vue: `<template><img testStyles=" lint " /> </template>`,
          vueOutput: `<template><img testStyles="lint" /> </template>`,

          errors: 1,
          options: [{
            attributes: ["^.*Styles$"]
          }]
        }
      ]
    });
  });

});
