import { describe, it } from "vitest";

import { enforceMotionSafeVariant } from "better-tailwindcss:rules/enforce-motion-safe-variant.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css, ts } from "better-tailwindcss:tests/utils/template.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version.js";


describe(enforceMotionSafeVariant.name, () => {

  it("should not report transition classes with the motion-safe variant", () => {
    lint(enforceMotionSafeVariant, {
      valid: [
        {
          angular: `<img class="motion-safe:transition-colors" />`,
          html: `<img class="motion-safe:transition-colors" />`,
          jsx: `() => <img class="motion-safe:transition-colors" />`,
          svelte: `<img class="motion-safe:transition-colors" />`,
          vue: `<template><img class="motion-safe:transition-colors" /></template>`
        },
        {
          angular: `<img class="motion-safe:transition" />`,
          html: `<img class="motion-safe:transition" />`,
          jsx: `() => <img class="motion-safe:transition" />`,
          svelte: `<img class="motion-safe:transition" />`,
          vue: `<template><img class="motion-safe:transition" /></template>`
        },
        {
          angular: `<img class="motion-safe:transition-all" />`,
          html: `<img class="motion-safe:transition-all" />`,
          jsx: `() => <img class="motion-safe:transition-all" />`,
          svelte: `<img class="motion-safe:transition-all" />`,
          vue: `<template><img class="motion-safe:transition-all" /></template>`
        }
      ]
    });
  });

  it("should not report animate classes with the motion-safe variant", () => {
    lint(enforceMotionSafeVariant, {
      valid: [
        {
          angular: `<img class="motion-safe:animate-spin" />`,
          html: `<img class="motion-safe:animate-spin" />`,
          jsx: `() => <img class="motion-safe:animate-spin" />`,
          svelte: `<img class="motion-safe:animate-spin" />`,
          vue: `<template><img class="motion-safe:animate-spin" /></template>`
        },
        {
          angular: `<img class="motion-safe:animate-none" />`,
          html: `<img class="motion-safe:animate-none" />`,
          jsx: `() => <img class="motion-safe:animate-none" />`,
          svelte: `<img class="motion-safe:animate-none" />`,
          vue: `<template><img class="motion-safe:animate-none" /></template>`
        }
      ]
    });
  });

  it("should not report non-motion classes", () => {
    lint(enforceMotionSafeVariant, {
      valid: [
        {
          angular: `<img class="text-red-500" />`,
          html: `<img class="text-red-500" />`,
          jsx: `() => <img class="text-red-500" />`,
          svelte: `<img class="text-red-500" />`,
          vue: `<template><img class="text-red-500" /></template>`
        },
        {
          angular: `<img class="duration-300" />`,
          html: `<img class="duration-300" />`,
          jsx: `() => <img class="duration-300" />`,
          svelte: `<img class="duration-300" />`,
          vue: `<template><img class="duration-300" /></template>`
        },
        {
          angular: `<img class="ease-in-out" />`,
          html: `<img class="ease-in-out" />`,
          jsx: `() => <img class="ease-in-out" />`,
          svelte: `<img class="ease-in-out" />`,
          vue: `<template><img class="ease-in-out" /></template>`
        }
      ]
    });
  });

  it("should report transition classes without the motion-safe variant", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="transition-colors" />`,
          html: `<img class="transition-colors" />`,
          jsx: `() => <img class="transition-colors" />`,
          svelte: `<img class="transition-colors" />`,
          vue: `<template><img class="transition-colors" /></template>`,

          errors: 1
        },
        {
          angular: `<img class="transition" />`,
          html: `<img class="transition" />`,
          jsx: `() => <img class="transition" />`,
          svelte: `<img class="transition" />`,
          vue: `<template><img class="transition" /></template>`,

          errors: 1
        },
        {
          angular: `<img class="transition-all" />`,
          html: `<img class="transition-all" />`,
          jsx: `() => <img class="transition-all" />`,
          svelte: `<img class="transition-all" />`,
          vue: `<template><img class="transition-all" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report animate classes without the motion-safe variant", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="animate-spin" />`,
          html: `<img class="animate-spin" />`,
          jsx: `() => <img class="animate-spin" />`,
          svelte: `<img class="animate-spin" />`,
          vue: `<template><img class="animate-spin" /></template>`,

          errors: 1
        },
        {
          angular: `<img class="animate-ping" />`,
          html: `<img class="animate-ping" />`,
          jsx: `() => <img class="animate-ping" />`,
          svelte: `<img class="animate-ping" />`,
          vue: `<template><img class="animate-ping" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report transition classes with other variants but missing motion-safe", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="hover:transition-colors" />`,
          html: `<img class="hover:transition-colors" />`,
          jsx: `() => <img class="hover:transition-colors" />`,
          svelte: `<img class="hover:transition-colors" />`,
          vue: `<template><img class="hover:transition-colors" /></template>`,

          errors: 1
        },
        {
          angular: `<img class="dark:animate-spin" />`,
          html: `<img class="dark:animate-spin" />`,
          jsx: `() => <img class="dark:animate-spin" />`,
          svelte: `<img class="dark:animate-spin" />`,
          vue: `<template><img class="dark:animate-spin" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report multiple motion classes in the same literal", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="transition-all animate-spin" />`,
          html: `<img class="transition-all animate-spin" />`,
          jsx: `() => <img class="transition-all animate-spin" />`,
          svelte: `<img class="transition-all animate-spin" />`,
          vue: `<template><img class="transition-all animate-spin" /></template>`,

          errors: 2
        }
      ]
    });
  });

  it("should suppress warnings when allowMotionReduce option is enabled and literal contains a motion-reduce class", () => {
    lint(enforceMotionSafeVariant, {
      valid: [
        {
          angular: `<img class="motion-reduce:transition-none transition-all" />`,
          html: `<img class="motion-reduce:transition-none transition-all" />`,
          jsx: `() => <img class="motion-reduce:transition-none transition-all" />`,
          svelte: `<img class="motion-reduce:transition-none transition-all" />`,
          vue: `<template><img class="motion-reduce:transition-none transition-all" /></template>`,

          options: [{ allowMotionReduce: true }]
        },
        {
          angular: `<img class="motion-reduce:animate-none animate-spin" />`,
          html: `<img class="motion-reduce:animate-none animate-spin" />`,
          jsx: `() => <img class="motion-reduce:animate-none animate-spin" />`,
          svelte: `<img class="motion-reduce:animate-none animate-spin" />`,
          vue: `<template><img class="motion-reduce:animate-none animate-spin" /></template>`,

          options: [{ allowMotionReduce: true }]
        }
      ]
    });
  });

  it("should still report when allowMotionReduce option is enabled but no motion-reduce class is present", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="transition-all" />`,
          html: `<img class="transition-all" />`,
          jsx: `() => <img class="transition-all" />`,
          svelte: `<img class="transition-all" />`,
          vue: `<template><img class="transition-all" /></template>`,

          errors: 1,

          options: [{ allowMotionReduce: true }]
        }
      ]
    });
  });

  it("should not report transition classes when custom patterns are set and do not include transition", () => {
    lint(enforceMotionSafeVariant, {
      valid: [
        {
          angular: `<img class="transition-all" />`,
          html: `<img class="transition-all" />`,
          jsx: `() => <img class="transition-all" />`,
          svelte: `<img class="transition-all" />`,
          vue: `<template><img class="transition-all" /></template>`,

          options: [{ classes: ["^my-animation$"] }]
        }
      ]
    });
  });

  it("should work in combination with other variants", () => {
    lint(enforceMotionSafeVariant, {
      valid: [
        {
          angular: `<img class="dark:motion-safe:transition-colors" />`,
          html: `<img class="dark:motion-safe:transition-colors" />`,
          jsx: `() => <img class="dark:motion-safe:transition-colors" />`,
          svelte: `<img class="dark:motion-safe:transition-colors" />`,
          vue: `<template><img class="dark:motion-safe:transition-colors" /></template>`
        },
        {
          angular: `<img class="motion-safe:hover:animate-spin" />`,
          html: `<img class="motion-safe:hover:animate-spin" />`,
          jsx: `() => <img class="motion-safe:hover:animate-spin" />`,
          svelte: `<img class="motion-safe:hover:animate-spin" />`,
          vue: `<template><img class="motion-safe:hover:animate-spin" /></template>`
        },
        {
          angular: `<img class="lg:dark:motion-safe:transition-all" />`,
          html: `<img class="lg:dark:motion-safe:transition-all" />`,
          jsx: `() => <img class="lg:dark:motion-safe:transition-all" />`,
          svelte: `<img class="lg:dark:motion-safe:transition-all" />`,
          vue: `<template><img class="lg:dark:motion-safe:transition-all" /></template>`
        }
      ]
    });
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should still work with a prefixed tailwind config in tailwind <= 3", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="tw-transition-colors" />`,
          html: `<img class="tw-transition-colors" />`,
          jsx: `() => <img class="tw-transition-colors" />`,
          svelte: `<img class="tw-transition-colors" />`,
          vue: `<template><img class="tw-transition-colors" /></template>`,

          errors: 1,

          files: {
            "tailwind.config.prefix.js": ts`
              export default {
                prefix: 'tw-',
              };
            `
          },
          options: [{ tailwindConfig: "./tailwind.config.prefix.js" }]
        }
      ],
      valid: [
        {
          angular: `<img class="tw-motion-safe:tw-transition-colors" />`,
          html: `<img class="tw-motion-safe:tw-transition-colors" />`,
          jsx: `() => <img class="tw-motion-safe:tw-transition-colors" />`,
          svelte: `<img class="tw-motion-safe:tw-transition-colors" />`,
          vue: `<template><img class="tw-motion-safe:tw-transition-colors" /></template>`,

          files: {
            "tailwind.config.prefix.js": ts`
              export default {
                prefix: 'tw-',
              };
            `
          },
          options: [{ tailwindConfig: "./tailwind.config.prefix.js" }]
        }
      ]
    });
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should still work with a prefixed tailwind config in tailwind >= 4", () => {
    lint(enforceMotionSafeVariant, {
      invalid: [
        {
          angular: `<img class="tw:transition-colors" />`,
          html: `<img class="tw:transition-colors" />`,
          jsx: `() => <img class="tw:transition-colors" />`,
          svelte: `<img class="tw:transition-colors" />`,
          vue: `<template><img class="tw:transition-colors" /></template>`,

          errors: 1,

          files: {
            "tailwind.css": css`
              @import "tailwindcss" prefix(tw);
            `
          },
          options: [{ entryPoint: "./tailwind.css" }]
        }
      ],
      valid: [
        {
          angular: `<img class="tw:motion-safe:transition-colors" />`,
          html: `<img class="tw:motion-safe:transition-colors" />`,
          jsx: `() => <img class="tw:motion-safe:transition-colors" />`,
          svelte: `<img class="tw:motion-safe:transition-colors" />`,
          vue: `<template><img class="tw:motion-safe:transition-colors" /></template>`,

          files: {
            "tailwind.css": css`
              @import "tailwindcss" prefix(tw);
            `
          },
          options: [{ entryPoint: "./tailwind.css" }]
        }
      ]
    });
  });

  it("should suppress warnings via allowMotionReduce option when motion-reduce class is in priorLiterals", () => {
    const expression = "${true ? 'foo' : 'bar'}";

    lint(enforceMotionSafeVariant, {
      valid: [
        {
          jsx: `() => <img class={\`motion-reduce:transition-none ${expression} transition-all\`} />`,
          svelte: `<img class={\`motion-reduce:transition-none ${expression} transition-all\`} />`,

          options: [{ allowMotionReduce: true }]
        }
      ]
    });
  });

});
