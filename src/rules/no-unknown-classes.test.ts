import { describe, it } from "vitest";

import { noUnknownClasses } from "better-tailwindcss:rules/no-unknown-classes.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css, ts } from "better-tailwindcss:tests/utils/template.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version";


describe(noUnknownClasses.name, () => {

  it("should not report standard tailwind classes", () => {
    lint(
      noUnknownClasses,
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
      noUnknownClasses,
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
      noUnknownClasses,
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

  it("should report standard tailwind classes with an unknown variant in many variants", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="dark:unknown:before:inset-0" />`,
            html: `<img class="dark:unknown:before:inset-0" />`,
            jsx: `() => <img class="dark:unknown:before:inset-0" />`,
            svelte: `<img class="dark:unknown:before:inset-0" />`,
            vue: `<template><img class="dark:unknown:before:inset-0" /></template>`,

            errors: 1
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should not report on dynamic utility values in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
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

  it.runIf(getTailwindCSSVersion().major <= 3)("should report on dynamic utility values in tailwind <= 3", () => {
    lint(
      noUnknownClasses,
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

  it("should report unknown classes", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="unknown" />`,
            html: `<img class="unknown" />`,
            jsx: `() => <img class="unknown" />`,
            svelte: `<img class="unknown" />`,
            vue: `<template><img class="unknown" /></template>`,

            errors: 1
          }
        ]
      }
    );
  });

  it("should still report classes declared in Svelte style blocks by default", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            svelte: `<style>.local-card { color: red; }</style><div class="local-card" />`,

            errors: 1
          }
        ]
      }
    );
  });

  it("should ignore classes declared in Svelte style blocks when configured", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            svelte: `<style>.local-card { color: red; }:global(.global-card) { color: blue; }</style><div class="local-card global-card flex" />`,

            options: [{ detectSvelteStyleClasses: true }]
          },
          {
            svelte: `<style>.foo\\:bar { color: red; }</style><div class="foo:bar" />`,

            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should ignore Svelte class directives declared in style blocks when configured", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            svelte: `<style>.local-card { color: red; }</style><div class:local-card={true} />`,

            errors: 1
          }
        ],
        valid: [
          {
            svelte: `<style>.local-card { color: red; }</style><div class:local-card={true} />`,

            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should ignore all class selectors declared in Svelte style blocks when configured", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            svelte: `<style>.card .title, .button.primary { color: red; }</style><div class="card title button primary" />`,

            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should still report unknown classes when the Svelte file has no style block", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            svelte: `<div class="local-card" />`,

            errors: 1,
            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should not detect Svelte style classes when the style block cannot be parsed", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            svelte: `<style lang="less">.local-card { color: red; }</style><div class="local-card" />`,

            errors: 1,
            options: [{ detectSvelteStyleClasses: true }]
          },
          {
            svelte: `<style>.local-card {</style><div class="local-card" />`,

            errors: 1,
            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should ignore Svelte style rules with selectors that cannot be parsed", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            svelte: `<style>.local-card: { color: red; }.known-card { color: blue; }</style><div class="local-card known-card" />`,

            errors: 1,
            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should only ignore exact classes declared in Svelte style blocks", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            svelte: `<style>.local-card { color: red; }</style><div class="hover:local-card" />`,

            errors: 1,
            options: [{ detectSvelteStyleClasses: true }]
          },
          {
            svelte: `<style>.local-card { color: red; }</style><div class="local-card typo-card" />`,

            errors: 1,
            options: [{ detectSvelteStyleClasses: true }]
          }
        ]
      }
    );
  });

  it("should compose Svelte style classes with ignored classes", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            svelte: `<style>.local-card { color: red; }</style><div class="local-card ignored-card" />`,

            options: [{
              detectSvelteStyleClasses: true,
              ignore: ["^ignored-card$"]
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should compose Svelte style classes with custom component classes in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            svelte: `<style>.local-card { color: red; }</style><div class="local-card custom-component" />`,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                @layer components {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              detectSvelteStyleClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it("should be possible to whitelist classes in options", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="unknown" />`,
            html: `<img class="unknown" />`,
            jsx: `() => <img class="unknown" />`,
            svelte: `<img class="unknown" />`,
            vue: `<template><img class="unknown" /></template>`,

            options: [{ ignore: ["unknown"] }]
          }
        ]
      }
    );
  });

  it("should be possible to whitelist classes in options via regex", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="ignored-unknown" />`,
            html: `<img class="ignored-unknown" />`,
            jsx: `() => <img class="ignored-unknown" />`,
            svelte: `<img class="ignored-unknown" />`,
            vue: `<template><img class="ignored-unknown" /></template>`,

            options: [{ ignore: ["^ignored-.*$"] }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should not report on registered utility classes in tailwind <= 3", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            html: `<img class="unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            jsx: `() => <img class="unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            svelte: `<img class="unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            vue: `<template><img class="unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" /></template>`,

            errors: 1,
            files: {
              "plugin.js": ts`
                export function plugin() {
                  return function({ addUtilities }) {
                    addUtilities({
                      ".in-plugin": {
                        color: "red"
                      }
                    });
                  };
                }
              `,
              "tailwind.config.color.js": ts`
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
              tailwindConfig: "./tailwind.config.color.js"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should not report on registered utility classes in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="in-utility unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            html: `<img class="in-utility unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            jsx: `() => <img class="in-utility unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            svelte: `<img class="in-utility unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" />`,
            vue: `<template><img class="in-utility unknown in-plugin text-config hover:before:in-plugin hover:before:text-config" /></template>`,

            errors: 1,
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
                export default {
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

                @config "./tailwind.config.js";
                @plugin "./plugin.js";

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

  it.runIf(getTailwindCSSVersion().major >= 4)("should ignore custom component classes defined in the component layer in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                @layer components {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ],
        valid: [
          {
            angular: `<img class="custom-component" />`,
            html: `<img class="custom-component" />`,
            jsx: `() => <img class="custom-component" />`,
            svelte: `<img class="custom-component" />`,
            vue: `<template><img class="custom-component" /></template>`,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                @layer components {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should ignore custom component classes defined in imported files in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "components.css": css`
                @layer components {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./components.css";
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "nested/dir/components.css": css`
                @layer components {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `,
              "nested/import.css": css`
                @import "./dir/components.css";
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./nested/import.css";
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should ignore classes defined in imported files with layer(components) in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        // immediate layer import
        invalid: [
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "components.css": css`
                .custom-component {
                  font-weight: bold;
                }
              `,
              "tailwind.css": css`
                @import "./components.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            // layer import via nested file
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "nested/dir/components.css": css`
                .custom-component {
                  @apply font-bold;
                }
              `,
              "nested/import.css": css`
                @import "./dir/components.css";
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./nested/import.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            // layer import in nested file
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "nested/dir/components.css": css`
                .custom-component {
                  @apply font-bold;
                }
              `,
              "nested/import.css": css`
                @import "./dir/components.css" layer(components);
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./nested/import.css";
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should ignore classes defined in imported files in nested components.custom layer in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "nested/dir/components.css": css`
                .custom-component {
                  @apply font-bold;
                }
              `,
              "nested/import.css": css`
                @import "./dir/components.css" layer(custom);
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./nested/import.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "nested/dir/components.css": css`
                @layer custom {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `,
              "nested/import.css": css`
                @import "./dir/components.css";
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./nested/import.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 1,

            files: {
              "nested/dir/components.css": css`
                @layer components {
                  @layer custom {
                    .custom-component {
                      @apply font-bold;
                    }
                  }
                }
              `,
              "nested/import.css": css`
                @import "./dir/components.css";
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./nested/import.css";
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should not ignore custom classes from other layers in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 2,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                @layer custom {
                  .custom-component {
                    font-weight: bold;
                  }
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 2,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                @layer custom {
                  @layer components {
                    .custom-component {
                      font-weight: bold;
                    }
                  }
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 2,

            files: {
              "./components.css": css`
                @layer components {
                  .custom-component {
                    font-weight: bold;
                  }
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./components.css" layer(custom);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 2,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                .custom-component {
                  font-weight: bold;
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should not crash when trying to read custom component classes in a file that doesn't exists in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="custom-component unknown" />`,
            html: `<img class="custom-component unknown" />`,
            jsx: `() => <img class="custom-component unknown" />`,
            svelte: `<img class="custom-component unknown" />`,
            vue: `<template><img class="custom-component unknown" /></template>`,

            errors: 2,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./does-not-exist.css";
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should support variants in custom component classes in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        // immediate layer import
        invalid: [
          {
            angular: `<img class="sm:hover:custom-component sm:hover:unknown" />`,
            html: `<img class="sm:hover:custom-component sm:hover:unknown" />`,
            jsx: `() => <img class="sm:hover:custom-component sm:hover:unknown" />`,
            svelte: `<img class="sm:hover:custom-component sm:hover:unknown" />`,
            vue: `<template><img class="sm:hover:custom-component sm:hover:unknown" /></template>`,

            errors: 1,

            files: {
              "components.css": css`
                .custom-component {
                  font-weight: bold;
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./components.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="[&[open]]:custom-component [&[open]]:unknown" />`,
            html: `<img class="[&[open]]:custom-component [&[open]]:unknown" />`,
            jsx: `() => <img class="[&[open]]:custom-component [&[open]]:unknown" />`,
            svelte: `<img class="[&[open]]:custom-component [&[open]]:unknown" />`,
            vue: `<template><img class="[&[open]]:custom-component [&[open]]:unknown" /></template>`,

            errors: 1,

            files: {
              "components.css": css`
                .custom-component {
                  font-weight: bold;
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss";
                @import "./components.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should support prefixes in custom component classes in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        // immediate layer import
        invalid: [
          {
            angular: `<img class="tw:md:custom-component tw:md:unknown" />`,
            html: `<img class="tw:md:custom-component tw:md:unknown" />`,
            jsx: `() => <img class="tw:md:custom-component tw:md:unknown" />`,
            svelte: `<img class="tw:md:custom-component tw:md:unknown" />`,
            vue: `<template><img class="tw:md:custom-component tw:md:unknown" /></template>`,

            errors: 1,

            files: {
              "components.css": css`
                .custom-component {
                  font-weight: bold;
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss" prefix(tw);
                @import "./components.css" layer(components);
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should work with prefixed tailwind classes tailwind <= 3", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="flex tw-flex hover:tw-flex"/>`,
            html: `<img class="flex tw-flex hover:tw-flex" />`,
            jsx: `() => <img class="flex tw-flex hover:tw-flex" />`,
            svelte: `<img class="flex tw-flex hover:tw-flex" />`,
            vue: `<template><img class="flex tw-flex hover:tw-flex" /></template>`,

            errors: 1,
            files: {
              "tailwind.config.prefix.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.prefix.js"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should work with prefixed tailwind classes tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="flex tw:flex tw:hover:flex"/>`,
            html: `<img class="flex tw:flex tw:hover:flex" />`,
            jsx: `() => <img class="flex tw:flex tw:hover:flex" />`,
            svelte: `<img class="flex tw:flex tw:hover:flex" />`,
            vue: `<template><img class="flex tw:flex tw:hover:flex" /></template>`,

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

  it.runIf(getTailwindCSSVersion().major <= 3)("should not report on DaisyUI classes in tailwind <= 3", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<details class="dropdown-hover btn"></details>`,
            html: `<details class="dropdown-hover btn"></details>`,
            jsx: `() => <details class="dropdown-hover btn"></details>`,
            svelte: `<details class="dropdown-hover btn"></details>`,
            vue: `<template><details class="dropdown-hover btn"></details></template>`,

            files: {
              "tailwind.config.ts": ts`
                import daisyui from "daisyui";

                export default {
                  plugins: [
                    daisyui
                  ],
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

  it.runIf(getTailwindCSSVersion().major >= 4)("should not report on DaisyUI classes in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<details class="dropdown-hover btn"></details>`,
            html: `<details class="dropdown-hover btn"></details>`,
            jsx: `() => <details class="dropdown-hover btn"></details>`,
            svelte: `<details class="dropdown-hover btn"></details>`,
            vue: `<template><details class="dropdown-hover btn"></details></template>`,

            errors: 1,
            files: {
              "tailwind.css": css`
                @import "tailwindcss";

                @plugin "daisyui";
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

  it("should not report on groups and peers", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="group" />`,
            html: `<img class="group" />`,
            jsx: `() => <img class="group" />`,
            svelte: `<img class="group" />`,
            vue: `<template><img class="group" /></template>`
          },
          {
            angular: `<img class="peer" />`,
            html: `<img class="peer" />`,
            jsx: `() => <img class="peer" />`,
            svelte: `<img class="peer" />`,
            vue: `<template><img class="peer" /></template>`
          }
        ]
      }
    );
  });

  it("should not report on named groups and peers", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="group/custom-group" />`,
            html: `<img class="group/custom-group" />`,
            jsx: `() => <img class="group/custom-group" />`,
            svelte: `<img class="group/custom-group" />`,
            vue: `<template><img class="group/custom-group" /></template>`
          },
          {
            angular: `<img class="peer/custom-peer" />`,
            html: `<img class="peer/custom-peer" />`,
            jsx: `() => <img class="peer/custom-peer" />`,
            svelte: `<img class="peer/custom-peer" />`,
            vue: `<template><img class="peer/custom-peer" /></template>`
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major <= 3)("should not report on prefixed groups and peers in tailwind <= 3", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="tw-group"/>`,
            html: `<img class="tw-group" />`,
            jsx: `() => <img class="tw-group" />`,
            svelte: `<img class="tw-group" />`,
            vue: `<template><img class="tw-group" /></template>`,

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
            angular: `<img class="tw-peer"/>`,
            html: `<img class="tw-peer" />`,
            jsx: `() => <img class="tw-peer" />`,
            svelte: `<img class="tw-peer" />`,
            vue: `<template><img class="tw-peer" /></template>`,

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

  it.runIf(getTailwindCSSVersion().major <= 3)("should not report on prefixed named groups and peers in tailwind <= 3", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="tw-group/custom-group"/>`,
            html: `<img class="tw-group/custom-group" />`,
            jsx: `() => <img class="tw-group/custom-group" />`,
            svelte: `<img class="tw-group/custom-group" />`,
            vue: `<template><img class="tw-group/custom-group" /></template>`,

            files: {
              "tailwind.config.prefix.js": ts`
                export default {
                  prefix: 'tw-',
                };
              `
            },
            options: [{
              tailwindConfig: "./tailwind.config.prefix.js"
            }]
          },
          {
            angular: `<img class="tw-peer/custom-peer"/>`,
            html: `<img class="tw-peer/custom-peer" />`,
            jsx: `() => <img class="tw-peer/custom-peer" />`,
            svelte: `<img class="tw-peer/custom-peer" />`,
            vue: `<template><img class="tw-peer/custom-peer" /></template>`,

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

  it.runIf(getTailwindCSSVersion().major >= 4)("should not report on prefixed groups and peers in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="tw:group"/>`,
            html: `<img class="tw:group" />`,
            jsx: `() => <img class="tw:group" />`,
            svelte: `<img class="tw:group" />`,
            vue: `<template><img class="tw:group" /></template>`,

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
            angular: `<img class="tw:peer"/>`,
            html: `<img class="tw:peer" />`,
            jsx: `() => <img class="tw:peer" />`,
            svelte: `<img class="tw:peer" />`,
            vue: `<template><img class="tw:peer" /></template>`,

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

  it.runIf(getTailwindCSSVersion().major >= 4)("should not report on prefixed named groups and peers in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="tw:group/custom-group"/>`,
            html: `<img class="tw:group/custom-group" />`,
            jsx: `() => <img class="tw:group/custom-group" />`,
            svelte: `<img class="tw:group/custom-group" />`,
            vue: `<template><img class="tw:group/custom-group" /></template>`,

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
            angular: `<img class="tw:peer/custom-peer"/>`,
            html: `<img class="tw:peer/custom-peer" />`,
            jsx: `() => <img class="tw:peer/custom-peer" />`,
            svelte: `<img class="tw:peer/custom-peer" />`,
            vue: `<template><img class="tw:peer/custom-peer" /></template>`,

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

  it("should not report on tailwind utility classes with modifiers", () => {
    lint(
      noUnknownClasses,
      {
        valid: [
          {
            angular: `<img class="bg-red-500/50" />`,
            html: `<img class="bg-red-500/50" />`,
            jsx: `() => <img class="bg-red-500/50" />`,
            svelte: `<img class="bg-red-500/50" />`,
            vue: `<template><img class="bg-red-500/50" /></template>`
          },
          {
            angular: `<img class="hover:bg-red-500/50" />`,
            html: `<img class="hover:bg-red-500/50" />`,
            jsx: `() => <img class="hover:bg-red-500/50" />`,
            svelte: `<img class="hover:bg-red-500/50" />`,
            vue: `<template><img class="hover:bg-red-500/50" /></template>`
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should support tsconfig paths in tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="unknown custom-component custom-utility custom-plugin"/>`,
            html: `<img class="unknown custom-component custom-utility custom-plugin" />`,
            jsx: `() => <img class="unknown custom-component custom-utility custom-plugin" />`,
            svelte: `<img class="unknown custom-component custom-utility custom-plugin" />`,
            vue: `<template><img class="unknown custom-component custom-utility custom-plugin" /></template>`,

            errors: 1,
            files: {
              "nested/components/custom-components.css": css`
                @layer components {
                  .custom-component {
                    @apply font-bold;
                  }
                }
              `,
              "nested/plugins/custom-plugin.js": ts`
                import createPlugin from "tailwindcss/plugin";

                export default createPlugin(({ addUtilities }) => {
                  addUtilities({
                    ".custom-plugin": {
                      fontWeight: "bold"
                    }
                  });
                });
              `,
              "nested/utilities/custom-utilities.css": css`
                @utility custom-utility {
                  font-weight: bold;
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss"; 
                @import "@components/custom-components.css";
                @import "@utilities/custom-utilities.css";
                @plugin "@plugins/custom-plugin.js";
              `,
              "tsconfig.json": ts`
                {
                  "compilerOptions": {
                    "paths": {
                      "@components/*": ["./nested/components/*"],
                      "@utilities/*": ["./nested/utilities/*"],
                      "@plugins/*": ["./nested/plugins/*"]
                    }
                  }
                }
              `
            },
            options: [{
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should use the provided tsconfig instead of finding one tailwind >= 4", () => {
    lint(
      noUnknownClasses,
      {
        invalid: [
          {
            angular: `<img class="unknown custom-utility"/>`,
            html: `<img class="unknown custom-utility" />`,
            jsx: `() => <img class="unknown custom-utility" />`,
            svelte: `<img class="unknown custom-utility" />`,
            vue: `<template><img class="unknown custom-utility" /></template>`,

            errors: 1,
            files: {
              "correct/custom-utilities.css": css`
                @utility custom-utility {
                  font-weight: bold;
                }
              `,
              "tailwind.css": css`
                @import "tailwindcss"; 
                @import "@correct/custom-utilities.css";
              `,
              "tsconfig-custom.json": ts`
                {
                  "compilerOptions": {
                    "paths": {
                      "@correct/*": ["./correct/*"],
                    }
                  }
                }
              `,
              "tsconfig.json": ts`
                {
                  "compilerOptions": {
                    "paths": {
                      "@unused/*": ["./unused/*"]
                    }
                  }
                }
              `
            },
            options: [{
              entryPoint: "./tailwind.css",
              tsconfig: "./tsconfig-custom.json"
            }]
          }
        ]
      }
    );
  });
});
