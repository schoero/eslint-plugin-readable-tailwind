import { describe, it } from "vitest";

import { noRestrictedClasses } from "better-tailwindcss:rules/no-restricted-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe(noRestrictedClasses.name, () => {

  it("should not report on unrestricted classes", () => {
    lint(noRestrictedClasses, TEST_SYNTAXES, {
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
    lint(noRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold container text-lg" />`,
          html: `<img class="font-bold container text-lg" />`,
          jsx: `() => <img class="font-bold container text-lg" />`,
          svelte: `<img class="font-bold container text-lg" />`,
          vue: `<template><img class="font-bold container text-lg" /></template>`,

          errors: 1,
          options: [{ restrict: ["container"] }]
        }
      ]
    });
  });

  it("should report restricted classes matching a regex", () => {
    lint(noRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold container text-lg" />`,
          html: `<img class="font-bold container text-lg" />`,
          jsx: `() => <img class="font-bold container text-lg" />`,
          svelte: `<img class="font-bold container text-lg" />`,
          vue: `<template><img class="font-bold container text-lg" /></template>`,

          errors: 1,
          options: [{ restrict: ["^container$"] }]
        }
      ]
    });
  });

  it("should report restricted classes with variants", () => {
    lint(noRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold lg:container lg:text-lg" />`,
          html: `<img class="font-bold lg:container lg:text-lg" />`,
          jsx: `() => <img class="font-bold lg:container lg:text-lg" />`,
          svelte: `<img class="font-bold lg:container lg:text-lg" />`,
          vue: `<template><img class="font-bold lg:container lg:text-lg" /></template>`,

          errors: 2,
          options: [{ restrict: ["^lg:.*"] }]
        }
      ]
    });
  });

  it("should report restricted classes containing reserved regex characters", () => {
    lint(noRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold *:container **:text-lg" />`,
          html: `<img class="font-bold *:container **:text-lg" />`,
          jsx: `() => <img class="font-bold *:container **:text-lg" />`,
          svelte: `<img class="font-bold *:container **:text-lg" />`,
          vue: `<template><img class="font-bold *:container **:text-lg" /></template>`,

          errors: 2,
          options: [{ restrict: ["^\\*+:.*"] }]
        }
      ]
    });
  });

  it("should be possible to disallow the important modifier", () => {
    lint(noRestrictedClasses, TEST_SYNTAXES, {
      invalid: [
        {
          angular: `<img class="font-bold text-lg!" />`,
          html: `<img class="font-bold text-lg!" />`,
          jsx: `() => <img class="font-bold text-lg!" />`,
          svelte: `<img class="font-bold text-lg!" />`,
          vue: `<template><img class="font-bold text-lg!" /></template>`,

          errors: 1,
          options: [{ restrict: ["^.*!$"] }]
        }
      ]
    });
  });

});
