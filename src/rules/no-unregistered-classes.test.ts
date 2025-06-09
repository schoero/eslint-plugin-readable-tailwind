import { getTailwindcssVersion, TailwindcssVersion } from "src/tailwind/utils/version.js";
import { describe, it } from "vitest";

import { noUnregisteredClasses } from "better-tailwindcss:rules/no-unregistered-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";
import { css, ts } from "better-tailwindcss:tests/utils/template.js";


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
            html: `<img class="dark:unregistered:before:inset-0" />`,
            jsx: `() => <img class="dark:unregistered:before:inset-0" />`,
            svelte: `<img class="dark:unregistered:before:inset-0" />`,
            vue: `<template><img class="dark:unregistered:before:inset-0" /></template>`,

            errors: 1
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
            html: `<img class="py-2.25" />`,
            jsx: `() => <img class="py-2.25" />`,
            svelte: `<img class="py-2.25" />`,
            vue: `<template><img class="py-2.25" /></template>`,

            errors: 1
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
            html: `<img class="unregistered" />`,
            jsx: `() => <img class="unregistered" />`,
            svelte: `<img class="unregistered" />`,
            vue: `<template><img class="unregistered" /></template>`,

            errors: 1
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
            svelte: `<img class="unregistered" />`,
            vue: `<template><img class="unregistered" /></template>`,

            options: [{ ignore: ["unregistered"] }]
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
            svelte: `<img class="ignored-unregistered" />`,
            vue: `<template><img class="ignored-unregistered" /></template>`,

            options: [{ ignore: ["^ignored-.*$"] }]
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

  it.skipIf(getTailwindcssVersion().major > TailwindcssVersion.V3)("should not report on registered utility classes in tailwind <= 3", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="unregistered from-plugin from-config hover:before:from-plugin hover:before:from-config" />`,
            html: `<img class="unregistered from-plugin from-config hover:before:from-plugin hover:before:from-config" />`,
            jsx: `() => <img class="unregistered from-plugin from-config hover:before:from-plugin hover:before:from-config" />`,
            svelte: `<img class="unregistered from-plugin from-config hover:before:from-plugin hover:before:from-config" />`,
            vue: `<template><img class="unregistered from-plugin from-config hover:before:from-plugin hover:before:from-config" /></template>`,

            errors: 1,
            files: {
              "plugin.js": ts`
                export function plugin() {
                  return function({ addUtilities }) {
                    addUtilities({
                      ".from-plugin": {
                        color: "red"
                      }
                    });
                  };
                }
              `,
              "tailwind.config.ts": ts`
                import { plugin } from "./plugin.js";

                export default {
                  plugins: [
                    plugin()
                  ],
                  theme: {
                    extend: {
                      colors: {
                        config: "red"
                      }
                    }
                  }
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.ts"
            }]
          }
        ]
      }
    );
  });

  it.skipIf(getTailwindcssVersion().major <= TailwindcssVersion.V4)("should not report on registered utility classes in tailwind >= 4", () => {
    lint(
      noUnregisteredClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="in-utility unregistered in-plugin text-in-config hover:before:in-plugin hover:before:text-in-config" />`,
            html: `<img class="in-utility unregistered in-plugin text-in-config hover:before:in-plugin hover:before:text-in-config" />`,
            jsx: `() => <img class="in-utility unregistered in-plugin text-in-config hover:before:in-plugin hover:before:text-in-config" />`,
            svelte: `<img class="in-utility unregistered in-plugin text-in-config hover:before:in-plugin hover:before:text-in-config" />`,
            vue: `<template><img class="in-utility unregistered in-plugin text-in-config hover:before:in-plugin hover:before:text-in-config" /></template>`,

            errors: 6,
            files: {
              "plugin.js": ts`
                import createPlugin from "tailwindcss/plugin";

                export default createPlugin(({ addUtilities }) => {
                  addUtilities({
                    ".in-plugin": {
                      color: "red"
                    }
                  });
                });
              `,
              "tailwind.config.js": ts`
                import { plugin } from "./plugin.js";

                export default {
                  plugins: [
                    plugin()
                  ],
                  theme: {
                    extend: {
                      colors: {
                        config: "red"
                      }
                    }
                  }
                };
              `,
              "tailwind.css": css`
                @import "tailwindcss";

                @config "./tailwind.config.ts";
                @plugin "./plugin.ts";

                @utility in-utility {
                  @apply text-red-500;
                }
              `
            },
            options: [{
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

});
