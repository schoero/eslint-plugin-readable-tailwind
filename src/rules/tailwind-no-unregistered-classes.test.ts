import { getTailwindcssVersion, TailwindcssVersion } from "src/tailwind/utils/version.js";
import { describe, it } from "vitest";

import { noUnregisteredClasses } from "better-tailwindcss:rules:tailwind-no-unregistered-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe(noUnregisteredClasses.name, () => {

  it("should not report standard tailwind classes", () => {
    lint(
      noUnregisteredClasses,
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
      noUnregisteredClasses,
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

  it("should not report standard tailwind classes with many variants", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="dark:hover:before:inset-0" />`,
            html: `<img class="dark:hover:before:inset-0" />`,
            jsx: `() => <img class="dark:hover:before:inset-0" />`,
            svelte: `<img class="dark:hover:before:inset-0" />`,
            vue: `<template><img class="dark:hover:before:inset-0" /></template>`
          }
        ]
      }
    );
  });

  it("should report standard tailwind classes with an unregistered variant in many variants", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="dark:unregistered:before:inset-0" />`,
            errors: 1,
            html: `<img class="dark:unregistered:before:inset-0" />`,
            jsx: `() => <img class="dark:unregistered:before:inset-0" />`,
            svelte: `<img class="dark:unregistered:before:inset-0" />`,
            vue: `<template><img class="dark:unregistered:before:inset-0" /></template>`
          }
        ]
      }
    );
  });

  it.skipIf(getTailwindcssVersion().major < TailwindcssVersion.V4)("should not report on dynamic utility values in tailwind >= 4", () => {
    lint(
      noUnregisteredClasses,
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

  it.skipIf(getTailwindcssVersion().major > TailwindcssVersion.V3)("should report on dynamic utility values in tailwind <= 3", () => {
    lint(
      noUnregisteredClasses,
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
      noUnregisteredClasses,
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

  it("should be possible to whitelist classes in options", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="unregistered" />`,
            html: `<img class="unregistered" />`,
            jsx: `() => <img class="unregistered" />`,
            options: [{ ignore: ["unregistered"] }],
            svelte: `<img class="unregistered" />`,
            vue: `<template><img class="unregistered" /></template>`
          }
        ]
      }
    );
  });

  it("should be possible to whitelist classes in options via regex", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="ignored-unregistered" />`,
            html: `<img class="ignored-unregistered" />`,
            jsx: `() => <img class="ignored-unregistered" />`,
            options: [{ ignore: ["^ignored-.*$"] }],
            svelte: `<img class="ignored-unregistered" />`,
            vue: `<template><img class="ignored-unregistered" /></template>`
          }
        ]
      }
    );
  });

  it("should not report on tailwind utility classes that don't produce a css output", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="group" />`,
            html: `<img class="group" />`,
            jsx: `() => <img class="group" />`,
            svelte: `<img class="group" />`,
            vue: `<template><img class="group" /></template>`
          }
        ]
      }
    );

    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="group/custom-group" />`,
            html: `<img class="group/custom-group" />`,
            jsx: `() => <img class="group/custom-group" />`,
            svelte: `<img class="group/custom-group" />`,
            vue: `<template><img class="group/custom-group" /></template>`
          }
        ]
      }
    );
  });

});
