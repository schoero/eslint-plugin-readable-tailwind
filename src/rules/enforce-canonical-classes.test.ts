import { describe, it } from "vitest";

import { enforceCanonicalClasses } from "better-tailwindcss:rules/enforce-canonical-classes.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css } from "better-tailwindcss:tests/utils/template.js";
import { values } from "better-tailwindcss:tests/utils/values.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version.js";


describe.runIf(getTailwindCSSVersion().major >= 4)(enforceCanonicalClasses.name, () => {

  it("should convert unnecessary arbitrary value to canonical class", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="[color:red]/100" />`,
          angularOutput: `<img class="text-[red]" />`,
          html: `<img class="[color:red]/100" />`,
          htmlOutput: `<img class="text-[red]" />`,
          jsx: `() => <img class="[color:red]/100" />`,
          jsxOutput: `() => <img class="text-[red]" />`,
          svelte: `<img class="[color:red]/100" />`,
          svelteOutput: `<img class="text-[red]" />`,
          vue: `<template><img class="[color:red]/100" /></template>`,
          vueOutput: `<template><img class="text-[red]" /></template>`,

          errors: [{
            message: values(enforceCanonicalClasses.messages!.single, {
              canonicalClass: "text-[red]",
              className: "[color:red]/100"
            })
          }],

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
    });
  });

  it("should convert multiple unnecessary arbitrary values to canonical classes", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="[@media_print]:flex [color:red]/50" />`,
          angularOutput: `<img class="print:flex text-[red]/50" />`,
          html: `<img class="[@media_print]:flex [color:red]/50" />`,
          htmlOutput: `<img class="print:flex text-[red]/50" />`,
          jsx: `() => <img class="[@media_print]:flex [color:red]/50" />`,
          jsxOutput: `() => <img class="print:flex text-[red]/50" />`,
          svelte: `<img class="[@media_print]:flex [color:red]/50" />`,
          svelteOutput: `<img class="print:flex text-[red]/50" />`,
          vue: `<template><img class="[@media_print]:flex [color:red]/50" /></template>`,
          vueOutput: `<template><img class="print:flex text-[red]/50" /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.single, {
                canonicalClass: "print:flex",
                className: "[@media_print]:flex"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.single, {
                canonicalClass: "text-[red]/50",
                className: "[color:red]/50"
              })
            }
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
    });
  });

  it("should not suggest a canonical class when it matches the enclosing utility name", () => {
    lint(enforceCanonicalClasses, {
      valid: [
        {
          css: css`
            @utility default-transition {
              @apply transition-all duration-800;
            }
          `,

          files: {
            "styles.css": css`
              @import "tailwindcss";

              @utility default-transition {
                @apply transition-all duration-800;
              }
            `
          },
          options: [{
            entryPoint: "styles.css"
          }]
        }
      ]
    });
  });

  it("should still suggest canonical classes inside utility blocks when output differs", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          css: css`
            @utility not-size {
              @apply w-10 h-10;
            }
          `,
          cssOutput: css`
            @utility not-size {
              @apply size-10 ;
            }
          `,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        }
      ]
    });
  });

  it("should collapse multiple utilities into a single utility", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="w-10 flex h-10 top-0 underline right-0 bottom-0 left-0" />`,
          angularOutput: `<img class="size-10 flex  inset-0 underline   " />`,
          html: `<img class="w-10 flex h-10 top-0 underline right-0 bottom-0 left-0" />`,
          htmlOutput: `<img class="size-10 flex  inset-0 underline   " />`,
          jsx: `() => <img class="w-10 flex h-10 top-0 underline right-0 bottom-0 left-0" />`,
          jsxOutput: `() => <img class="size-10 flex  inset-0 underline   " />`,
          svelte: `<img class="w-10 flex h-10 top-0 underline right-0 bottom-0 left-0" />`,
          svelteOutput: `<img class="size-10 flex  inset-0 underline   " />`,
          vue: `<template><img class="w-10 flex h-10 top-0 underline right-0 bottom-0 left-0" /></template>`,
          vueOutput: `<template><img class="size-10 flex  inset-0 underline   " /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "inset-0",
                classNames: "top-0, right-0, bottom-0, left-0"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "inset-0",
                classNames: "top-0, right-0, bottom-0, left-0"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "inset-0",
                classNames: "top-0, right-0, bottom-0, left-0"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "inset-0",
                classNames: "top-0, right-0, bottom-0, left-0"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        },
        {
          angular: `<img class="w-10 h-10 flex" />`,
          angularOutput: `<img class="size-10  flex" />`,
          html: `<img class="w-10 h-10 flex" />`,
          htmlOutput: `<img class="size-10  flex" />`,
          jsx: `() => <img class="w-10 h-10 flex" />`,
          jsxOutput: `() => <img class="size-10  flex" />`,
          svelte: `<img class="w-10 h-10 flex" />`,
          svelteOutput: `<img class="size-10  flex" />`,
          vue: `<template><img class="w-10 h-10 flex" /></template>`,
          vueOutput: `<template><img class="size-10  flex" /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        }
      ]
    });
  });

  it("should convert size correctly", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="w-[20px] h-[20px]" />`,
          angularOutput: `<img class="size-5 " />`,
          html: `<img class="w-[20px] h-[20px]" />`,
          htmlOutput: `<img class="size-5 " />`,
          jsx: `() => <img class="w-[20px] h-[20px]" />`,
          jsxOutput: `() => <img class="size-5 " />`,
          svelte: `<img class="w-[20px] h-[20px]" />`,
          svelteOutput: `<img class="size-5 " />`,
          vue: `<template><img class="w-[20px] h-[20px]" /></template>`,
          vueOutput: `<template><img class="size-5 " /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-5",
                classNames: "w-[20px], h-[20px]"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-5",
                classNames: "w-[20px], h-[20px]"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          settings: {
            "better-tailwindcss": {
              entryPoint: "styles.css",
              rootFontSize: 16
            }
          }
        }
      ]
    });
  });

  it("should convert to logical properties", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="mr-2 ml-2" />`,
          angularOutput: `<img class="mx-2 " />`,
          html: `<img class="mr-2 ml-2" />`,
          htmlOutput: `<img class="mx-2 " />`,
          jsx: `() => <img class="mr-2 ml-2" />`,
          jsxOutput: `() => <img class="mx-2 " />`,
          svelte: `<img class="mr-2 ml-2" />`,
          svelteOutput: `<img class="mx-2 " />`,
          vue: `<template><img class="mr-2 ml-2" /></template>`,
          vueOutput: `<template><img class="mx-2 " /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "mx-2",
                classNames: "mr-2, ml-2"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "mx-2",
                classNames: "mr-2, ml-2"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            entryPoint: "styles.css",
            logical: true,
            rootFontSize: 16
          }]
        }
      ]
    });
  });

  it("should still work when unknown classes are passed", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="w-10 h-10 unknown" />`,
          angularOutput: `<img class="size-10  unknown" />`,
          html: `<img class="w-10 h-10 unknown" />`,
          htmlOutput: `<img class="size-10  unknown" />`,
          jsx: `() => <img class="w-10 h-10 unknown" />`,
          jsxOutput: `() => <img class="size-10  unknown" />`,
          svelte: `<img class="w-10 h-10 unknown" />`,
          svelteOutput: `<img class="size-10  unknown" />`,
          vue: `<template><img class="w-10 h-10 unknown" /></template>`,
          vueOutput: `<template><img class="size-10  unknown" /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        }
      ]
    });
  });

  // #369
  it("should be possible to ignore classes that match specific patterns", () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="-mt-[0.04in] [color:red]/100" />`,
          angularOutput: `<img class="-mt-[0.04in] text-[red]" />`,
          html: `<img class="-mt-[0.04in] [color:red]/100" />`,
          htmlOutput: `<img class="-mt-[0.04in] text-[red]" />`,
          jsx: `() => <img class="-mt-[0.04in] [color:red]/100" />`,
          jsxOutput: `() => <img class="-mt-[0.04in] text-[red]" />`,
          svelte: `<img class="-mt-[0.04in] [color:red]/100" />`,
          svelteOutput: `<img class="-mt-[0.04in] text-[red]" />`,
          vue: `<template><img class="-mt-[0.04in] [color:red]/100" /></template>`,
          vueOutput: `<template><img class="-mt-[0.04in] text-[red]" /></template>`,

          errors: [{
            message: values(enforceCanonicalClasses.messages!.single, {
              canonicalClass: "text-[red]",
              className: "[color:red]/100"
            })
          }],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            entryPoint: "styles.css",
            ignore: ["^\\S*\\[.*in\\]$"]
          }]
        }
      ]
    });
  });

  // #304
  it("should not remove unrelated classes when simplifying", { timeout: 30_000 }, () => {
    lint(enforceCanonicalClasses, {
      invalid: [
        {
          angular: `<img class="flex grid aspect-[4/3]" />`,
          angularOutput: `<img class="flex grid aspect-4/3" />`,
          html: "<img class='flex grid aspect-[4/3]' />",
          htmlOutput: "<img class='flex grid aspect-4/3' />",
          jsx: `() => <img className="flex grid aspect-[4/3]" />`,
          jsxOutput: `() => <img className="flex grid aspect-4/3" />`,
          svelte: `<img class="flex grid aspect-[4/3]" />`,
          svelteOutput: `<img class="flex grid aspect-4/3" />`,
          vue: `<template><img class="flex grid aspect-[4/3]" /></template>`,
          vueOutput: `<template><img class="flex grid aspect-4/3" /></template>`,

          errors: [{
            message: values(enforceCanonicalClasses.messages!.single, {
              canonicalClass: "aspect-4/3",
              className: "aspect-[4/3]"
            })
          }],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        },
        {
          angular: `<img class="flex grid block aspect-[4/3] inline" />`,
          angularOutput: `<img class="flex grid block aspect-4/3 inline" />`,
          html: `<img class="flex grid block aspect-[4/3] inline" />`,
          htmlOutput: `<img class="flex grid block aspect-4/3 inline" />`,
          jsx: `() => <img className="flex grid block aspect-[4/3] inline" />`,
          jsxOutput: `() => <img className="flex grid block aspect-4/3 inline" />`,
          svelte: `<img class="flex grid block aspect-[4/3] inline" />`,
          svelteOutput: `<img class="flex grid block aspect-4/3 inline" />`,
          vue: `<template><img class="flex grid block aspect-[4/3] inline" /></template>`,
          vueOutput: `<template><img class="flex grid block aspect-4/3 inline" /></template>`,

          errors: [{
            message: values(enforceCanonicalClasses.messages!.single, {
              canonicalClass: "aspect-4/3",
              className: "aspect-[4/3]"
            })
          }],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        },
        {
          angular: `<img class="w-10 h-10 flex grid aspect-[4/3] inline" />`,
          angularOutput: `<img class="size-10  flex grid aspect-4/3 inline" />`,
          html: `<img class="w-10 h-10 flex grid aspect-[4/3] inline" />`,
          htmlOutput: `<img class="size-10  flex grid aspect-4/3 inline" />`,
          jsx: `() => <img className="w-10 h-10 flex grid aspect-[4/3] inline" />`,
          jsxOutput: `() => <img className="size-10  flex grid aspect-4/3 inline" />`,
          svelte: `<img class="w-10 h-10 flex grid aspect-[4/3] inline" />`,
          svelteOutput: `<img class="size-10  flex grid aspect-4/3 inline" />`,
          vue: `<template><img class="w-10 h-10 flex grid aspect-[4/3] inline" /></template>`,
          vueOutput: `<template><img class="size-10  flex grid aspect-4/3 inline" /></template>`,

          errors: [
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.multiple, {
                canonicalClass: "size-10",
                classNames: "w-10, h-10"
              })
            },
            {
              message: values(enforceCanonicalClasses.messages!.single, {
                canonicalClass: "aspect-4/3",
                className: "aspect-[4/3]"
              })
            }
          ],

          files: {
            "styles.css": css`
              @import "tailwindcss";
            `
          },
          options: [{
            collapse: true,
            entryPoint: "styles.css"
          }]
        }
      ]
    });
  });
});
