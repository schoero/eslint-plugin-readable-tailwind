import { describe, it } from "vitest";

import { enforceConsistentImportantPosition } from "better-tailwindcss:rules/enforce-consistent-important-position.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css, ts } from "better-tailwindcss:tests/utils/template.js";
import { values } from "better-tailwindcss:tests/utils/values.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version";
import { augmentMessageWithWarnings } from "better-tailwindcss:utils/utils.js";


describe(enforceConsistentImportantPosition.name, () => {

  it(`should move the important modifier correct position`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="!w-4" />`,
            angularOutput: `<img class="w-4!" />`,
            html: `<img class="!w-4" />`,
            htmlOutput: `<img class="w-4!" />`,
            jsx: `() => <img class="!w-4" />`,
            jsxOutput: `() => <img class="w-4!" />`,
            svelte: `<img class="!w-4" />`,
            svelteOutput: `<img class="w-4!" />`,
            vue: `<template><img class="!w-4" /></template>`,
            vueOutput: `<template><img class="w-4!" /></template>`,

            errors: 1,
            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="w-4!" />`,
            angularOutput: `<img class="!w-4" />`,
            html: `<img class="w-4!" />`,
            htmlOutput: `<img class="!w-4" />`,
            jsx: `() => <img class="w-4!" />`,
            jsxOutput: `() => <img class="!w-4" />`,
            svelte: `<img class="w-4!" />`,
            svelteOutput: `<img class="!w-4" />`,
            vue: `<template><img class="w-4!" /></template>`,
            vueOutput: `<template><img class="!w-4" /></template>`,

            errors: 1,
            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it(`should handle classes with variants correctly`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="hover:!text-red-500" />`,
            angularOutput: `<img class="hover:text-red-500!" />`,
            html: `<img class="hover:!text-red-500" />`,
            htmlOutput: `<img class="hover:text-red-500!" />`,
            jsx: `() => <img class="hover:!text-red-500" />`,
            jsxOutput: `() => <img class="hover:text-red-500!" />`,
            svelte: `<img class="hover:!text-red-500" />`,
            svelteOutput: `<img class="hover:text-red-500!" />`,
            vue: `<template><img class="hover:!text-red-500" /></template>`,
            vueOutput: `<template><img class="hover:text-red-500!" /></template>`,

            errors: 1,
            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="hover:text-red-500!" />`,
            angularOutput: `<img class="hover:!text-red-500" />`,
            html: `<img class="hover:text-red-500!" />`,
            htmlOutput: `<img class="hover:!text-red-500" />`,
            jsx: `() => <img class="hover:text-red-500!" />`,
            jsxOutput: `() => <img class="hover:!text-red-500" />`,
            svelte: `<img class="hover:text-red-500!" />`,
            svelteOutput: `<img class="hover:!text-red-500" />`,
            vue: `<template><img class="hover:text-red-500!" /></template>`,
            vueOutput: `<template><img class="hover:!text-red-500" /></template>`,

            errors: 1,
            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it(`should handle multiple variants`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="sm:hover:!bg-blue-500" />`,
            angularOutput: `<img class="sm:hover:bg-blue-500!" />`,
            html: `<img class="sm:hover:!bg-blue-500" />`,
            htmlOutput: `<img class="sm:hover:bg-blue-500!" />`,
            jsx: `() => <img class="sm:hover:!bg-blue-500" />`,
            jsxOutput: `() => <img class="sm:hover:bg-blue-500!" />`,
            svelte: `<img class="sm:hover:!bg-blue-500" />`,
            svelteOutput: `<img class="sm:hover:bg-blue-500!" />`,
            vue: `<template><img class="sm:hover:!bg-blue-500" /></template>`,
            vueOutput: `<template><img class="sm:hover:bg-blue-500!" /></template>`,

            errors: 1,
            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="sm:hover:bg-blue-500!" />`,
            angularOutput: `<img class="sm:hover:!bg-blue-500" />`,
            html: `<img class="sm:hover:bg-blue-500!" />`,
            htmlOutput: `<img class="sm:hover:!bg-blue-500" />`,
            jsx: `() => <img class="sm:hover:bg-blue-500!" />`,
            jsxOutput: `() => <img class="sm:hover:!bg-blue-500" />`,
            svelte: `<img class="sm:hover:bg-blue-500!" />`,
            svelteOutput: `<img class="sm:hover:!bg-blue-500" />`,
            vue: `<template><img class="sm:hover:bg-blue-500!" /></template>`,
            vueOutput: `<template><img class="sm:hover:!bg-blue-500" /></template>`,

            errors: 1,
            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it(`should handle multiple classes with mixed important positions`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="!w-4 hover:text-red-500! normal-class" />`,
            angularOutput: `<img class="w-4! hover:text-red-500! normal-class" />`,
            html: `<img class="!w-4 hover:text-red-500! normal-class" />`,
            htmlOutput: `<img class="w-4! hover:text-red-500! normal-class" />`,
            jsx: `() => <img class="!w-4 hover:text-red-500! normal-class" />`,
            jsxOutput: `() => <img class="w-4! hover:text-red-500! normal-class" />`,
            svelte: `<img class="!w-4 hover:text-red-500! normal-class" />`,
            svelteOutput: `<img class="w-4! hover:text-red-500! normal-class" />`,
            vue: `<template><img class="!w-4 hover:text-red-500! normal-class" /></template>`,
            vueOutput: `<template><img class="w-4! hover:text-red-500! normal-class" /></template>`,

            errors: 1,
            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="w-4! hover:!text-red-500 normal-class" />`,
            angularOutput: `<img class="!w-4 hover:!text-red-500 normal-class" />`,
            html: `<img class="w-4! hover:!text-red-500 normal-class" />`,
            htmlOutput: `<img class="!w-4 hover:!text-red-500 normal-class" />`,
            jsx: `() => <img class="w-4! hover:!text-red-500 normal-class" />`,
            jsxOutput: `() => <img class="!w-4 hover:!text-red-500 normal-class" />`,
            svelte: `<img class="w-4! hover:!text-red-500 normal-class" />`,
            svelteOutput: `<img class="!w-4 hover:!text-red-500 normal-class" />`,
            vue: `<template><img class="w-4! hover:!text-red-500 normal-class" /></template>`,
            vueOutput: `<template><img class="!w-4 hover:!text-red-500 normal-class" /></template>`,

            errors: 1,
            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)(`should not repeat the unsupported position warning for multiple classes in tailwind <= 3`, () => {
    const warning = augmentMessageWithWarnings("", enforceConsistentImportantPosition.rule.meta.docs.url, [{
      option: "position",
      title: `The "recommended" position is not supported in Tailwind CSS v3`,
      url: `${enforceConsistentImportantPosition.rule.meta.docs.url}#position`
    }]);

    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            html: `<img class="!w-4 !h-4" />`,
            htmlOutput: `<img class="w-4! h-4!" />`,
            jsx: `() => <img class="!w-4 !h-4" />`,
            jsxOutput: `() => <img class="w-4! h-4!" />`,

            errors: [
              { message: `${warning}${values(enforceConsistentImportantPosition.messages!.position, { className: "!w-4", fix: "w-4!" })}` },
              { message: `${warning}${values(enforceConsistentImportantPosition.messages!.position, { className: "!h-4", fix: "h-4!" })}` }
            ],
            files: {
              "tailwind.config.js": ts`
                export default {};
              `
            },
            options: [{
              position: "recommended",
              tailwindConfig: "./tailwind.config.js"
            }]
          }
        ]
      }
    );
  });

  it(`should handle arbitrary values correctly`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="!w-[100px]" />`,
            angularOutput: `<img class="w-[100px]!" />`,
            html: `<img class="!w-[100px]" />`,
            htmlOutput: `<img class="w-[100px]!" />`,
            jsx: `() => <img class="!w-[100px]" />`,
            jsxOutput: `() => <img class="w-[100px]!" />`,
            svelte: `<img class="!w-[100px]" />`,
            svelteOutput: `<img class="w-[100px]!" />`,
            vue: `<template><img class="!w-[100px]" /></template>`,
            vueOutput: `<template><img class="w-[100px]!" /></template>`,

            errors: 1,
            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="w-[100px]!" />`,
            angularOutput: `<img class="!w-[100px]" />`,
            html: `<img class="w-[100px]!" />`,
            htmlOutput: `<img class="!w-[100px]" />`,
            jsx: `() => <img class="w-[100px]!" />`,
            jsxOutput: `() => <img class="!w-[100px]" />`,
            svelte: `<img class="w-[100px]!" />`,
            svelteOutput: `<img class="!w-[100px]" />`,
            vue: `<template><img class="w-[100px]!" /></template>`,
            vueOutput: `<template><img class="!w-[100px]" /></template>`,

            errors: 1,
            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it(`should not report errors for correctly positioned important modifiers`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        valid: [
          {
            angular: `<img class="w-4! hover:text-red-500! normal-class" />`,
            html: `<img class="w-4! hover:text-red-500! normal-class" />`,
            jsx: `() => <img class="w-4! hover:text-red-500! normal-class" />`,
            svelte: `<img class="w-4! hover:text-red-500! normal-class" />`,
            vue: `<template><img class="w-4! hover:text-red-500! normal-class" /></template>`,

            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="!w-4 hover:!text-red-500 normal-class" />`,
            html: `<img class="!w-4 hover:!text-red-500 normal-class" />`,
            jsx: `() => <img class="!w-4 hover:!text-red-500 normal-class" />`,
            svelte: `<img class="!w-4 hover:!text-red-500 normal-class" />`,
            vue: `<template><img class="!w-4 hover:!text-red-500 normal-class" /></template>`,

            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it(`should not report errors for classes without important modifiers`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        valid: [
          {
            angular: `<img class="w-4 hover:text-red-500 normal-class" />`,
            html: `<img class="w-4 hover:text-red-500 normal-class" />`,
            jsx: `() => <img class="w-4 hover:text-red-500 normal-class" />`,
            svelte: `<img class="w-4 hover:text-red-500 normal-class" />`,
            vue: `<template><img class="w-4 hover:text-red-500 normal-class" /></template>`,

            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="w-4 hover:text-red-500 normal-class" />`,
            html: `<img class="w-4 hover:text-red-500 normal-class" />`,
            jsx: `() => <img class="w-4 hover:text-red-500 normal-class" />`,
            svelte: `<img class="w-4 hover:text-red-500 normal-class" />`,
            vue: `<template><img class="w-4 hover:text-red-500 normal-class" /></template>`,

            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)(`should use "recommended" as default position when no option is provided in tailwind >= 4`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="!w-4" />`,
            angularOutput: `<img class="w-4!" />`,
            html: `<img class="!w-4" />`,
            htmlOutput: `<img class="w-4!" />`,
            jsx: `() => <img class="!w-4" />`,
            jsxOutput: `() => <img class="w-4!" />`,
            svelte: `<img class="!w-4" />`,
            svelteOutput: `<img class="w-4!" />`,
            vue: `<template><img class="!w-4" /></template>`,
            vueOutput: `<template><img class="w-4!" /></template>`,

            errors: 1
            // No options provided - should default to "recommended"
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)(`should use "legacy" as default position when no option is provided in tailwind <= 3`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="w-4!" />`,
            angularOutput: `<img class="!w-4" />`,
            html: `<img class="w-4!" />`,
            htmlOutput: `<img class="!w-4" />`,
            jsx: `() => <img class="w-4!" />`,
            jsxOutput: `() => <img class="!w-4" />`,
            svelte: `<img class="w-4!" />`,
            svelteOutput: `<img class="!w-4" />`,
            vue: `<template><img class="w-4!" /></template>`,
            vueOutput: `<template><img class="!w-4" /></template>`,

            errors: 1
            // No options provided - should default to "legacy"
          }
        ]
      }
    );
  });

  it(`should keep modifiers in the correct position when changing the important position`, () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="!bg-red-500/50" />`,
            angularOutput: `<img class="bg-red-500/50!" />`,
            html: `<img class="!bg-red-500/50" />`,
            htmlOutput: `<img class="bg-red-500/50!" />`,
            jsx: `() => <img class="!bg-red-500/50" />`,
            jsxOutput: `() => <img class="bg-red-500/50!" />`,
            svelte: `<img class="!bg-red-500/50" />`,
            svelteOutput: `<img class="bg-red-500/50!" />`,
            vue: `<template><img class="!bg-red-500/50" /></template>`,
            vueOutput: `<template><img class="bg-red-500/50!" /></template>`,

            errors: 1,
            options: [{ position: "recommended" }]
          },
          {
            angular: `<img class="bg-red-500/50!" />`,
            angularOutput: `<img class="!bg-red-500/50" />`,
            html: `<img class="bg-red-500/50!" />`,
            htmlOutput: `<img class="!bg-red-500/50" />`,
            jsx: `() => <img class="bg-red-500/50!" />`,
            jsxOutput: `() => <img class="!bg-red-500/50" />`,
            svelte: `<img class="bg-red-500/50!" />`,
            svelteOutput: `<img class="!bg-red-500/50" />`,
            vue: `<template><img class="bg-red-500/50!" /></template>`,
            vueOutput: `<template><img class="!bg-red-500/50" /></template>`,

            errors: 1,
            options: [{ position: "legacy" }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should work with prefixed tailwind classes in tailwind <= 3", () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="tw-w-4!" />`,
            angularOutput: `<img class="!tw-w-4" />`,
            html: `<img class="tw-w-4!" />`,
            htmlOutput: `<img class="!tw-w-4" />`,
            jsx: `() => <img class="tw-w-4!" />`,
            jsxOutput: `() => <img class="!tw-w-4" />`,
            svelte: `<img class="tw-w-4!" />`,
            svelteOutput: `<img class="!tw-w-4" />`,
            vue: `<template><img class="tw-w-4!" /></template>`,
            vueOutput: `<template><img class="!tw-w-4" /></template>`,

            errors: 1,
            files: {
              "tailwind.config.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              position: "legacy",
              tailwindConfig: "./tailwind.config.js"
            }]
          },
          {
            angular: `<img class="hover:tw-w-4!" />`,
            angularOutput: `<img class="hover:!tw-w-4" />`,
            html: `<img class="hover:tw-w-4!" />`,
            htmlOutput: `<img class="hover:!tw-w-4" />`,
            jsx: `() => <img class="hover:tw-w-4!" />`,
            jsxOutput: `() => <img class="hover:!tw-w-4" />`,
            svelte: `<img class="hover:tw-w-4!" />`,
            svelteOutput: `<img class="hover:!tw-w-4" />`,
            vue: `<template><img class="hover:tw-w-4!" /></template>`,
            vueOutput: `<template><img class="hover:!tw-w-4" /></template>`,

            errors: 1,
            files: {
              "tailwind.config.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              position: "legacy",
              tailwindConfig: "./tailwind.config.js"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should work with prefixed tailwind classes in tailwind >= 4", () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="tw:!w-4" />`,
            angularOutput: `<img class="tw:w-4!" />`,
            html: `<img class="tw:!w-4" />`,
            htmlOutput: `<img class="tw:w-4!" />`,
            jsx: `() => <img class="tw:!w-4" />`,
            jsxOutput: `() => <img class="tw:w-4!" />`,
            svelte: `<img class="tw:!w-4" />`,
            svelteOutput: `<img class="tw:w-4!" />`,
            vue: `<template><img class="tw:!w-4" /></template>`,
            vueOutput: `<template><img class="tw:w-4!" /></template>`,

            errors: 1,
            files: {
              "tailwind.css": css`
                @import "tailwindcss" prefix(tw);
              `
            },
            options: [{
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="tw:hover:!w-4" />`,
            angularOutput: `<img class="tw:hover:w-4!" />`,
            html: `<img class="tw:hover:!w-4" />`,
            htmlOutput: `<img class="tw:hover:w-4!" />`,
            jsx: `() => <img class="tw:hover:!w-4" />`,
            jsxOutput: `() => <img class="tw:hover:w-4!" />`,
            svelte: `<img class="tw:hover:!w-4" />`,
            svelteOutput: `<img class="tw:hover:w-4!" />`,
            vue: `<template><img class="tw:hover:!w-4" /></template>`,
            vueOutput: `<template><img class="tw:hover:w-4!" /></template>`,

            errors: 1,
            files: {
              "tailwind.css": css`
                @import "tailwindcss" prefix(tw);
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

  // #399
  it.runIf(getTailwindCSSVersion().major >= 4)("should handle important modifiers on classes with arbitrary variants correctly", () => {
    lint(
      enforceConsistentImportantPosition,

      {
        invalid: [
          {
            angular: `<img class="[&:is(:active,__[data-open])]:!p-4" />`,
            angularOutput: `<img class="[&:is(:active,__[data-open])]:p-4!" />`,
            html: `<img class="[&:is(:active,__[data-open])]:!p-4" />`,
            htmlOutput: `<img class="[&:is(:active,__[data-open])]:p-4!" />`,
            jsx: `() => <img class="[&:is(:active,__[data-open])]:!p-4" />`,
            jsxOutput: `() => <img class="[&:is(:active,__[data-open])]:p-4!" />`,
            svelte: `<img class="[&:is(:active,__[data-open])]:!p-4" />`,
            svelteOutput: `<img class="[&:is(:active,__[data-open])]:p-4!" />`,
            vue: `<template><img class="[&:is(:active,__[data-open])]:!p-4" /></template>`,
            vueOutput: `<template><img class="[&:is(:active,__[data-open])]:p-4!" /></template>`,

            errors: 1
          }
        ]
      }
    );
  });

});
