import { getTailwindcssVersion } from "src/tailwind/utils/version.js";
import { describe, it } from "vitest";

import { tailwindNoUnregisteredClasses } from "readable-tailwind:rules:tailwind-no-unregistered-classes.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe(tailwindNoUnregisteredClasses.name, () => {

  it("should not report standard tailwind classes", () => {
    lint(
      tailwindNoUnregisteredClasses,
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

  it("should not report standard tailwind classes with variants", () => {
    lint(
      tailwindNoUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="hover:flex" />`,
            html: `<img class="hover:flex" />`,
            jsx: `() => <img class="hover:flex" />`,
            svelte: `<img class="hover:flex" />`,
            vue: `<template><img class="hover:flex" /></template>`
          }
        ]
      }
    );
  });

  it.skipIf(getTailwindcssVersion().major < 4)("should not report on dynamic utility values in tailwind >= 4", () => {
    lint(
      tailwindNoUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="py-2.25" />`,
            html: `<img class="py-2.25" />`,
            jsx: `() => <img class="py-2.25" />`,
            svelte: `<img class="py-2.25" />`,
            vue: `<template><img class="py-2.25" /></template>`
          }
        ]
      }
    );
  });

  it.skipIf(getTailwindcssVersion().major > 3)("should report on dynamic utility values in tailwind <= 3", () => {
    lint(
      tailwindNoUnregisteredClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="py-2.25" />`,
            errors: 1,
            html: `<img class="py-2.25" />`,
            jsx: `() => <img class="py-2.25" />`,
            svelte: `<img class="py-2.25" />`,
            vue: `<template><img class="py-2.25" /></template>`
          }
        ]
      }
    );
  });

  it("should report unregistered classes", () => {
    lint(
      tailwindNoUnregisteredClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="unregistered" />`,
            errors: 1,
            html: `<img class="unregistered" />`,
            jsx: `() => <img class="unregistered" />`,
            svelte: `<img class="unregistered" />`,
            vue: `<template><img class="unregistered" /></template>`
          }
        ]
      }
    );
  });

  it.todo("should be possible to whitelist classes in options");

  it.todo("should be possible to whitelist classes in options via regex");

  it.todo("should be possible to register custom classes in the config");

  it.todo("should not report on custom utility classes");

  it.todo("should not report on classes from plugins");

});
