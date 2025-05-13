import { describe, it } from "vitest";

import { tailwindNoConflictingClasses } from "better-tailwindcss:rules:tailwind-no-conflicting-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe(tailwindNoConflictingClasses.name, () => {

  it("should not report on non-conflicting tailwind classes", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="flex" />`,
            html: `<img class="flex" />`,
            jsx: `() => <img class="flex" />`,
            svelte: `<img class="flex" />`,
            vue: `<template><img class="flex" /></template>`
          }
        ]
      }
    );
  });

  it("should report on conflicting tailwind classes", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<div class="flex block"></div>`,
            errors: 2,
            html: `<div class="flex block"></div>`,
            jsx: `() => <div class="flex block"></div>`,
            svelte: `<div class="flex block"></div>`,
            vue: `<template><div class="flex block"></div></template>`
          }
        ]
      }
    );
  });

  it("should not report on different variants", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<div class="flex hover:block"></div>`,
            html: `<div class="flex hover:block"></div>`,
            jsx: `() => <div class="flex hover:block"></div>`,
            svelte: `<div class="flex hover:block"></div>`,
            vue: `<template><div class="flex hover:block"></div></template>`
          }
        ]
      }
    );
  });

  it("should not report on the variants itself", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<div class="hover:flex hover:font-bold"></div>`,
            html: `<div class="hover:flex hover:font-bold"></div>`,
            jsx: `() => <div class="hover:flex hover:font-bold"></div>`,
            svelte: `<div class="hover:flex hover:font-bold"></div>`,
            vue: `<template><div class="hover:flex hover:font-bold"></div></template>`
          }
        ]
      }
    );
  });

  it("should report on the same variants", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<div class="hover:flex hover:block"></div>`,
            errors: 2,
            html: `<div class="hover:flex hover:block"></div>`,
            jsx: `() => <div class="hover:flex hover:block"></div>`,
            svelte: `<div class="hover:flex hover:block"></div>`,
            vue: `<template><div class="hover:flex hover:block"></div></template>`
          }
        ]
      }
    );
  });

  it("should not report on classes if one of them has an important flag", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<div class="flex block!"></div>`,
            html: `<div class="flex block!"></div>`,
            jsx: `() => <div class="flex block!"></div>`,
            svelte: `<div class="flex block!"></div>`,
            vue: `<template><div class="flex block!"></div></template>`
          }
        ]
      }
    );
  });

  it("should not report for css properties with an `undefined` value", () => {
    lint(
      tailwindNoConflictingClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<div class="text-sm font-thin"></div>`,
            html: `<div class="text-sm font-thin"></div>`,
            jsx: `() => <div class="text-sm font-thin"></div>`,
            svelte: `<div class="text-sm font-thin"></div>`,
            vue: `<template><div class="text-sm font-thin"></div></template>`
          }
        ]
      }
    );
  });

});
