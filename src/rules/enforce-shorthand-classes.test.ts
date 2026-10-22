import { describe, it } from "vitest";

import { enforceShorthandClasses } from "better-tailwindcss:rules/enforce-shorthand-classes.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css, ts } from "better-tailwindcss:tests/utils/template.js";
import { values } from "better-tailwindcss:tests/utils/values.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version";


describe(enforceShorthandClasses.name, () => {

  it("should not report on shorthand classes", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="size-4" />`,
            html: `<img class="size-4" />`,
            jsx: `() => <img class="size-4" />`,
            svelte: `<img class="size-4" />`,
            vue: `<template><img class="size-4" /></template>`
          }
        ]
      }
    );
  });

  it("should not report on classes that have no shorthand", () => {
    lint(
      enforceShorthandClasses,
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

  it("should collapse multiple classes into their shorthand", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="w-4 h-4" />`,
            angularOutput: `<img class="size-4 " />`,
            html: `<img class="w-4 h-4" />`,
            htmlOutput: `<img class="size-4 " />`,
            jsx: `() => <img class="w-4 h-4" />`,
            jsxOutput: `() => <img class="size-4 " />`,
            svelte: `<img class="w-4 h-4" />`,
            svelteOutput: `<img class="size-4 " />`,
            vue: `<template><img class="w-4 h-4" /></template>`,
            vueOutput: `<template><img class="size-4 " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should not collapse classes if they have a different sign", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="w-4 -h-4" />`,
            html: `<img class="w-4 -h-4" />`,
            jsx: `() => <img class="w-4 -h-4" />`,
            svelte: `<img class="w-4 -h-4" />`,
            vue: `<template><img class="w-4 -h-4" /></template>`
          }
        ]
      }
    );
  });

  it("should collapse many classes into their shorthand", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="pt-4 pr-4 pb-4 pl-4" />`,
            angularOutput: `<img class="p-4   " />`,
            html: `<img class="pt-4 pr-4 pb-4 pl-4" />`,
            htmlOutput: `<img class="p-4   " />`,
            jsx: `() => <img class="pt-4 pr-4 pb-4 pl-4" />`,
            jsxOutput: `() => <img class="p-4   " />`,
            svelte: `<img class="pt-4 pr-4 pb-4 pl-4" />`,
            svelteOutput: `<img class="p-4   " />`,
            vue: `<template><img class="pt-4 pr-4 pb-4 pl-4" /></template>`,
            vueOutput: `<template><img class="p-4   " /></template>`,

            errors: 4
          }
        ]
      }
    );
  });

  it("should not collapse differing classes into an otherwise valid shorthand", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="pt-4 pr-2 pb-4 pl-4" />`,
            angularOutput: `<img class="py-4 pr-2  pl-4" />`,
            html: `<img class="pt-4 pr-2 pb-4 pl-4" />`,
            htmlOutput: `<img class="py-4 pr-2  pl-4" />`,
            jsx: `() => <img class="pt-4 pr-2 pb-4 pl-4" />`,
            jsxOutput: `() => <img class="py-4 pr-2  pl-4" />`,
            svelte: `<img class="pt-4 pr-2 pb-4 pl-4" />`,
            svelteOutput: `<img class="py-4 pr-2  pl-4" />`,
            vue: `<template><img class="pt-4 pr-2 pb-4 pl-4" /></template>`,
            vueOutput: `<template><img class="py-4 pr-2  pl-4" /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should work with variants", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="hover:w-4 hover:h-4" />`,
            angularOutput: `<img class="hover:size-4 " />`,
            html: `<img class="hover:w-4 hover:h-4" />`,
            htmlOutput: `<img class="hover:size-4 " />`,
            jsx: `() => <img class="hover:w-4 hover:h-4" />`,
            jsxOutput: `() => <img class="hover:size-4 " />`,
            svelte: `<img class="hover:w-4 hover:h-4" />`,
            svelteOutput: `<img class="hover:size-4 " />`,
            vue: `<template><img class="hover:w-4 hover:h-4" /></template>`,
            vueOutput: `<template><img class="hover:size-4 " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should not report when one instance has a variant", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="w-4 hover:h-4" />`,
            html: `<img class="w-4 hover:h-4" />`,
            jsx: `() => <img class="w-4 hover:h-4" />`,
            svelte: `<img class="w-4 hover:h-4" />`,
            vue: `<template><img class="w-4 hover:h-4" /></template>`
          }
        ]
      }
    );
  });

  it("should not report when one instance has a different variant", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="focus:w-4 hover:h-4" />`,
            html: `<img class="focus:w-4 hover:h-4" />`,
            jsx: `() => <img class="focus:w-4 hover:h-4" />`,
            svelte: `<img class="focus:w-4 hover:h-4" />`,
            vue: `<template><img class="focus:w-4 hover:h-4" /></template>`
          }
        ]
      }
    );
  });

  it("should handle arbitrary values correctly", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="w-[10px] h-[10px]" />`,
            angularOutput: `<img class="size-[10px] " />`,
            html: `<img class="w-[10px] h-[10px]" />`,
            htmlOutput: `<img class="size-[10px] " />`,
            jsx: `() => <img class="w-[10px] h-[10px]" />`,
            jsxOutput: `() => <img class="size-[10px] " />`,
            svelte: `<img class="w-[10px] h-[10px]" />`,
            svelteOutput: `<img class="size-[10px] " />`,
            vue: `<template><img class="w-[10px] h-[10px]" /></template>`,
            vueOutput: `<template><img class="size-[10px] " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should not collapse arbitrary values with different values", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="w-[10px] h-[20px]" />`,
            html: `<img class="w-[10px] h-[20px]" />`,
            jsx: `() => <img class="w-[10px] h-[20px]" />`,
            svelte: `<img class="w-[10px] h-[20px]" />`,
            vue: `<template><img class="w-[10px] h-[20px]" /></template>`
          }
        ]
      }
    );
  });

  it("should handle complex variants correctly", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="sm:hover:w-4 sm:hover:h-4" />`,
            angularOutput: `<img class="sm:hover:size-4 " />`,
            html: `<img class="sm:hover:w-4 sm:hover:h-4" />`,
            htmlOutput: `<img class="sm:hover:size-4 " />`,
            jsx: `() => <img class="sm:hover:w-4 sm:hover:h-4" />`,
            jsxOutput: `() => <img class="sm:hover:size-4 " />`,
            svelte: `<img class="sm:hover:w-4 sm:hover:h-4" />`,
            svelteOutput: `<img class="sm:hover:size-4 " />`,
            vue: `<template><img class="sm:hover:w-4 sm:hover:h-4" /></template>`,
            vueOutput: `<template><img class="sm:hover:size-4 " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should not shorten mixed positive and negative values", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="ml-4 -mr-4 mt-4 mb-4" />`,
            angularOutput: `<img class="ml-4 -mr-4 my-4 " />`,
            html: `<img class="ml-4 -mr-4 mt-4 mb-4" />`,
            htmlOutput: `<img class="ml-4 -mr-4 my-4 " />`,
            jsx: `() => <img class="ml-4 -mr-4 mt-4 mb-4" />`,
            jsxOutput: `() => <img class="ml-4 -mr-4 my-4 " />`,
            svelte: `<img class="ml-4 -mr-4 mt-4 mb-4" />`,
            svelteOutput: `<img class="ml-4 -mr-4 my-4 " />`,
            vue: `<template><img class="ml-4 -mr-4 mt-4 mb-4" /></template>`,
            vueOutput: `<template><img class="ml-4 -mr-4 my-4 " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should not shorten mixed important and non important classes in tailwind <= 3", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="!w-4 h-4" />`,
            html: `<img class="!w-4 h-4" />`,
            jsx: `() => <img class="!w-4 h-4" />`,
            svelte: `<img class="!w-4 h-4" />`,
            vue: `<template><img class="!w-4 h-4" /></template>`
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should not shorten mixed important and non important classes in tailwind >= 4", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="w-4! h-4" />`,
            html: `<img class="w-4! h-4" />`,
            jsx: `() => <img class="w-4! h-4" />`,
            svelte: `<img class="w-4! h-4" />`,
            vue: `<template><img class="w-4! h-4" /></template>`
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should still shorten mixed starting and ending important classes in tailwind >= 4", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="w-4! !h-4" />`,
            angularOutput: `<img class="size-4! " />`,
            html: `<img class="w-4! !h-4" />`,
            htmlOutput: `<img class="size-4! " />`,
            jsx: `() => <img class="w-4! !h-4" />`,
            jsxOutput: `() => <img class="size-4! " />`,
            svelte: `<img class="w-4! !h-4" />`,
            svelteOutput: `<img class="size-4! " />`,
            vue: `<template><img class="w-4! !h-4" /></template>`,
            vueOutput: `<template><img class="size-4! " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should keep important at the start if all classes have important at the start in tailwind >= 4", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="!w-4 !h-4" />`,
            angularOutput: `<img class="!size-4 " />`,
            html: `<img class="!w-4 !h-4" />`,
            htmlOutput: `<img class="!size-4 " />`,
            jsx: `() => <img class="!w-4 !h-4" />`,
            jsxOutput: `() => <img class="!size-4 " />`,
            svelte: `<img class="!w-4 !h-4" />`,
            svelteOutput: `<img class="!size-4 " />`,
            vue: `<template><img class="!w-4 !h-4" /></template>`,
            vueOutput: `<template><img class="!size-4 " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should shorten when all classes are important in tailwind <= 3", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="!w-4 !h-4" />`,
            angularOutput: `<img class="!size-4 " />`,
            html: `<img class="!w-4 !h-4" />`,
            htmlOutput: `<img class="!size-4 " />`,
            jsx: `() => <img class="!w-4 !h-4" />`,
            jsxOutput: `() => <img class="!size-4 " />`,
            svelte: `<img class="!w-4 !h-4" />`,
            svelteOutput: `<img class="!size-4 " />`,
            vue: `<template><img class="!w-4 !h-4" /></template>`,
            vueOutput: `<template><img class="!size-4 " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should shorten when all classes are important in tailwind >= 4", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="w-4! h-4!" />`,
            angularOutput: `<img class="size-4! " />`,
            html: `<img class="w-4! h-4!" />`,
            htmlOutput: `<img class="size-4! " />`,
            jsx: `() => <img class="w-4! h-4!" />`,
            jsxOutput: `() => <img class="size-4! " />`,
            svelte: `<img class="w-4! h-4!" />`,
            svelteOutput: `<img class="size-4! " />`,
            vue: `<template><img class="w-4! h-4!" /></template>`,
            vueOutput: `<template><img class="size-4! " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should work with prefixed tailwind classes in tailwind <= 3", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="tw-w-full tw-h-full" />`,
            angularOutput: `<img class="tw-size-full " />`,
            html: `<img class="tw-w-full tw-h-full" />`,
            htmlOutput: `<img class="tw-size-full " />`,
            jsx: `() => <img class="tw-w-full tw-h-full" />`,
            jsxOutput: `() => <img class="tw-size-full " />`,
            svelte: `<img class="tw-w-full tw-h-full" />`,
            svelteOutput: `<img class="tw-size-full " />`,
            vue: `<template><img class="tw-w-full tw-h-full" /></template>`,
            vueOutput: `<template><img class="tw-size-full " /></template>`,

            errors: 2,
            files: {
              "tailwind.config.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.js"
            }]
          },
          {
            angular: `<img class="hover:tw-w-full hover:tw-h-full" />`,
            angularOutput: `<img class="hover:tw-size-full " />`,
            html: `<img class="hover:tw-w-full hover:tw-h-full" />`,
            htmlOutput: `<img class="hover:tw-size-full " />`,
            jsx: `() => <img class="hover:tw-w-full hover:tw-h-full" />`,
            jsxOutput: `() => <img class="hover:tw-size-full " />`,
            svelte: `<img class="hover:tw-w-full hover:tw-h-full" />`,
            svelteOutput: `<img class="hover:tw-size-full " />`,
            vue: `<template><img class="hover:tw-w-full hover:tw-h-full" /></template>`,
            vueOutput: `<template><img class="hover:tw-size-full " /></template>`,

            errors: 2,
            files: {
              "tailwind.config.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.js"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should work with prefixed tailwind classes in tailwind >= 4", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="tw:w-full tw:h-full" />`,
            angularOutput: `<img class="tw:size-full " />`,
            html: `<img class="tw:w-full tw:h-full" />`,
            htmlOutput: `<img class="tw:size-full " />`,
            jsx: `() => <img class="tw:w-full tw:h-full" />`,
            jsxOutput: `() => <img class="tw:size-full " />`,
            svelte: `<img class="tw:w-full tw:h-full" />`,
            svelteOutput: `<img class="tw:size-full " />`,
            vue: `<template><img class="tw:w-full tw:h-full" /></template>`,
            vueOutput: `<template><img class="tw:size-full " /></template>`,

            errors: 2,
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
            angular: `<img class="tw:hover:w-full tw:hover:h-full" />`,
            angularOutput: `<img class="tw:hover:size-full " />`,
            html: `<img class="tw:hover:w-full tw:hover:h-full" />`,
            htmlOutput: `<img class="tw:hover:size-full " />`,
            jsx: `() => <img class="tw:hover:w-full tw:hover:h-full" />`,
            jsxOutput: `() => <img class="tw:hover:size-full " />`,
            svelte: `<img class="tw:hover:w-full tw:hover:h-full" />`,
            svelteOutput: `<img class="tw:hover:size-full " />`,
            vue: `<template><img class="tw:hover:w-full tw:hover:h-full" /></template>`,
            vueOutput: `<template><img class="tw:hover:size-full " /></template>`,

            errors: 2,
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

  it.runIf(getTailwindCSSVersion().major <= 3)("should not work if the shorthand class doesn't actually exist <= 3", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="w-screen h-screen" />`,
            html: `<img class="w-screen h-screen" />`,
            jsx: `() => <img class="w-screen h-screen" />`,
            svelte: `<img class="w-screen h-screen" />`,
            vue: `<template><img class="w-screen h-screen" /></template>`
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should not work if the shorthand class doesn't actually exist in tailwind >= 4", () => {
    lint(
      enforceShorthandClasses,
      {
        valid: [
          {
            angular: `<img class="w-screen h-screen" />`,
            html: `<img class="w-screen h-screen" />`,
            jsx: `() => <img class="w-screen h-screen" />`,
            svelte: `<img class="w-screen h-screen" />`,
            vue: `<template><img class="w-screen h-screen" /></template>`
          }
        ]
      }
    );
  });

  it("should not add an additional class if the shorthand class is already present", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="size-4 w-4 h-4" />`,
            angularOutput: `<img class="size-4  " />`,
            html: `<img class="size-4 w-4 h-4" />`,
            htmlOutput: `<img class="size-4  " />`,
            jsx: `() => <img class="size-4 w-4 h-4" />`,
            jsxOutput: `() => <img class="size-4  " />`,
            svelte: `<img class="size-4 w-4 h-4" />`,
            svelteOutput: `<img class="size-4  " />`,
            vue: `<template><img class="size-4 w-4 h-4" /></template>`,
            vueOutput: `<template><img class="size-4  " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should shorten multiple variants separately", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="w-4 h-4 hover:w-8 hover:h-8" />`,
            angularOutput: `<img class="size-4  hover:size-8 " />`,
            html: `<img class="w-4 h-4 hover:w-8 hover:h-8" />`,
            htmlOutput: `<img class="size-4  hover:size-8 " />`,
            jsx: `() => <img class="w-4 h-4 hover:w-8 hover:h-8" />`,
            jsxOutput: `() => <img class="size-4  hover:size-8 " />`,
            svelte: `<img class="w-4 h-4 hover:w-8 hover:h-8" />`,
            svelteOutput: `<img class="size-4  hover:size-8 " />`,
            vue: `<template><img class="w-4 h-4 hover:w-8 hover:h-8" /></template>`,
            vueOutput: `<template><img class="size-4  hover:size-8 " /></template>`,

            errors: 4
          }
        ]
      }
    );
  });

  it("should collapse align and justify classes into their place shorthand", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            angular: `<img class="content-center justify-center" />`,
            angularOutput: `<img class="place-content-center " />`,
            html: `<img class="content-center justify-center" />`,
            htmlOutput: `<img class="place-content-center " />`,
            jsx: `() => <img class="content-center justify-center" />`,
            jsxOutput: `() => <img class="place-content-center " />`,
            svelte: `<img class="content-center justify-center" />`,
            svelteOutput: `<img class="place-content-center " />`,
            vue: `<template><img class="content-center justify-center" /></template>`,
            vueOutput: `<template><img class="place-content-center " /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should report the removal of redundant longhand classes", () => {
    lint(
      enforceShorthandClasses,
      {
        invalid: [
          {
            html: `<img class="w-4 h-4" />`,
            htmlOutput: `<img class="size-4 " />`,
            jsx: `() => <img class="w-4 h-4" />`,
            jsxOutput: `() => <img class="size-4 " />`,

            errors: [
              { message: values(enforceShorthandClasses.messages!.longhand, { longhands: "w-4 h-4", shorthands: "size-4" }) },
              { message: values(enforceShorthandClasses.messages!.unnecessary, { className: "h-4", shorthands: "size-4" }) }
            ],
            files: {
              "styles.css": css`
                @import "tailwindcss";
              `
            },
            options: [{
              entryPoint: "styles.css"
            }]
          }
        ]
      }
    );
  });

});
