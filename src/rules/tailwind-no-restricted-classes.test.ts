import { describe, it } from "vitest";

import { tailwindNoRestrictedClasses } from "better-tailwindcss:rules:tailwind-no-restricted-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe(tailwindNoRestrictedClasses.name, () => {

  it("should not report on unrestricted classes", () => {
    lint(tailwindNoRestrictedClasses, TEST_SYNTAXES, {
      valid: [
        {
          angular: `<img class="font-bold container text-lg" />`,
          html: `<img class="font-bold container text-lg" />`,
          jsx: `() => <img class="font-bold container text-lg" />`,
          svelte: `<img class="font-bold container text-lg" />`,
          vue: `<template><img class="font-bold container text-lg" /></template>`
        }
      ]
    });
  });

  it("should report restricted classes", () => {
    lint(tailwindNoRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold container text-lg" />`,
          errors: 1,
          html: `<img class="font-bold container text-lg" />`,
          jsx: `() => <img class="font-bold container text-lg" />`,
          options: [{ restrict: ["container"] }],
          svelte: `<img class="font-bold container text-lg" />`,
          vue: `<template><img class="font-bold container text-lg" /></template>`
        }
      ]
    });
  });

  it("should report restricted classes matching a regex", () => {
    lint(tailwindNoRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold container text-lg" />`,
          errors: 1,
          html: `<img class="font-bold container text-lg" />`,
          jsx: `() => <img class="font-bold container text-lg" />`,
          options: [{ restrict: ["^container$"] }],
          svelte: `<img class="font-bold container text-lg" />`,
          vue: `<template><img class="font-bold container text-lg" /></template>`
        }
      ]
    });
  });

  it("should report restricted classes with variants", () => {
    lint(tailwindNoRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold lg:container lg:text-lg" />`,
          errors: 2,
          html: `<img class="font-bold lg:container lg:text-lg" />`,
          jsx: `() => <img class="font-bold lg:container lg:text-lg" />`,
          options: [{ restrict: ["^lg:.*"] }],
          svelte: `<img class="font-bold lg:container lg:text-lg" />`,
          vue: `<template><img class="font-bold lg:container lg:text-lg" /></template>`
        }
      ]
    });
  });

  it("should report restricted classes containing reserved regex characters", () => {
    lint(tailwindNoRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold *:container **:text-lg" />`,
          errors: 2,
          html: `<img class="font-bold *:container **:text-lg" />`,
          jsx: `() => <img class="font-bold *:container **:text-lg" />`,
          options: [{ restrict: ["^\\*+:.*"] }],
          svelte: `<img class="font-bold *:container **:text-lg" />`,
          vue: `<template><img class="font-bold *:container **:text-lg" /></template>`
        }
      ]
    });
  });

  it("should be possible to disallow the important modifier", () => {
    lint(tailwindNoRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold text-lg!" />`,
          errors: 1,
          html: `<img class="font-bold text-lg!" />`,
          jsx: `() => <img class="font-bold text-lg!" />`,
          options: [{ restrict: ["^.*!$"] }],
          svelte: `<img class="font-bold text-lg!" />`,
          vue: `<template><img class="font-bold text-lg!" /></template>`
        }
      ]
    });
  });

});
