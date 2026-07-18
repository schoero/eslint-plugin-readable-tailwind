import { describe, it } from "vitest";

import { enforceConsistentClassOrder } from "better-tailwindcss:rules/enforce-consistent-class-order.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css } from "better-tailwindcss:tests/utils/template.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version.js";


describe(enforceConsistentClassOrder.name, () => {

  it("should sort simple class names in string literals by the defined order", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="b a" />`,
            angularOutput: `<img class="a b" />`,
            html: `<img class="b a" />`,
            htmlOutput: `<img class="a b" />`,
            jsx: `() => <img class="b a" />`,
            jsxOutput: `() => <img class="a b" />`,
            svelte: `<img class="b a" />`,
            svelteOutput: `<img class="a b" />`,
            vue: `<template><img class="b a" /></template>`,
            vueOutput: `<template><img class="a b" /></template>`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img class="a b" />`,
            angularOutput: `<img class="b a" />`,
            html: `<img class="a b" />`,
            htmlOutput: `<img class="b a" />`,
            jsx: `() => <img class="a b" />`,
            jsxOutput: `() => <img class="b a" />`,
            svelte: `<img class="a b" />`,
            svelteOutput: `<img class="b a" />`,
            vue: `<template><img class="a b" /></template>`,
            vueOutput: `<template><img class="b a" /></template>`,

            errors: 1,
            options: [{ order: "desc" }]
          },
          {
            angular: `<img class="w-full absolute" />`,
            angularOutput: `<img class="absolute w-full" />`,
            html: `<img class="w-full absolute" />`,
            htmlOutput: `<img class="absolute w-full" />`,
            jsx: `() => <img class="w-full absolute" />`,
            jsxOutput: `() => <img class="absolute w-full" />`,
            svelte: `<img class="w-full absolute" />`,
            svelteOutput: `<img class="absolute w-full" />`,
            vue: `<template><img class="w-full absolute" /></template>`,
            vueOutput: `<template><img class="absolute w-full" /></template>`,

            errors: 1,
            options: [{ order: "official" }]
          }
        ],
        valid: [
          {
            angular: `<img class="a b" />`,
            html: `<img class="a b" />`,
            jsx: `() => <img class="a b" />`,
            svelte: `<img class="a b" />`,
            vue: `<template><img class="a b" /></template>`,

            options: [{ order: "asc" }]
          },
          {
            angular: `<img class="b a" />`,
            html: `img class="b a" />`,
            jsx: `() => <img class="b a" />`,
            svelte: `img class="b a" />`,
            vue: `<template><img class="b a" /></template>`,

            options: [{ order: "desc" }]
          },
          {
            angular: `<img class="absolute w-full" />`,
            html: `<img class="absolute w-full" />`,
            jsx: `() => <img class="absolute w-full" />`,
            svelte: `<img class="absolute w-full" />`,
            vue: `<template><img class="absolute w-full" /></template>`,

            options: [{ order: "official" }]
          }
        ]
      }
    );
  });

  it("should sort alphabetically in a locale-independent way for `asc` and `desc`", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="py-24 px-12" />`,
            angularOutput: `<img class="px-12 py-24" />`,
            html: `<img class="py-24 px-12" />`,
            htmlOutput: `<img class="px-12 py-24" />`,
            jsx: `() => <img class="py-24 px-12" />`,
            jsxOutput: `() => <img class="px-12 py-24" />`,
            svelte: `<img class="py-24 px-12" />`,
            svelteOutput: `<img class="px-12 py-24" />`,
            vue: `<template><img class="py-24 px-12" /></template>`,
            vueOutput: `<template><img class="px-12 py-24" /></template>`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img class="px-12 py-24" />`,
            angularOutput: `<img class="py-24 px-12" />`,
            html: `<img class="px-12 py-24" />`,
            htmlOutput: `<img class="py-24 px-12" />`,
            jsx: `() => <img class="px-12 py-24" />`,
            jsxOutput: `() => <img class="py-24 px-12" />`,
            svelte: `<img class="px-12 py-24" />`,
            svelteOutput: `<img class="py-24 px-12" />`,
            vue: `<template><img class="px-12 py-24" /></template>`,
            vueOutput: `<template><img class="py-24 px-12" /></template>`,

            errors: 1,
            options: [{ order: "desc" }]
          }
        ]
      }
    );
  });

  it("should group all classes with the same variant together", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          angular: `<img class="hover:text-black focus:text-black dark:text-black focus:text-white hover:text-white dark:text-white" />`,
          angularOutput: `<img class="hover:text-black hover:text-white focus:text-black focus:text-white dark:text-black dark:text-white" />`,
          html: `<img class="hover:text-black focus:text-black dark:text-black focus:text-white hover:text-white dark:text-white" />`,
          htmlOutput: `<img class="hover:text-black hover:text-white focus:text-black focus:text-white dark:text-black dark:text-white" />`,
          jsx: `() => <img class="hover:text-black focus:text-black dark:text-black focus:text-white hover:text-white dark:text-white" />`,
          jsxOutput: `() => <img class="hover:text-black hover:text-white focus:text-black focus:text-white dark:text-black dark:text-white" />`,
          svelte: `<img class="hover:text-black focus:text-black dark:text-black focus:text-white hover:text-white dark:text-white" />`,
          svelteOutput: `<img class="hover:text-black hover:text-white focus:text-black focus:text-white dark:text-black dark:text-white" />`,
          vue: `<template><img class="hover:text-black focus:text-black dark:text-black focus:text-white hover:text-white dark:text-white" /></template>`,
          vueOutput: `<template><img class="hover:text-black hover:text-white focus:text-black focus:text-white dark:text-black dark:text-white" /></template>`,

          errors: 1,
          options: [{ order: "official" }]
        }
      ]
    });
  });

  it("should keep the quotes as they are", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="b a" />`,
            angularOutput: `<img class="a b" />`,
            html: `<img class="b a" />`,
            htmlOutput: `<img class="a b" />`,
            jsx: `() => <img class="b a" />`,
            jsxOutput: `() => <img class="a b" />`,
            svelte: `<img class="b a" />`,
            svelteOutput: `<img class="a b" />`,
            vue: `<template><img class="b a" /></template>`,
            vueOutput: `<template><img class="a b" /></template>`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img class='b a' />`,
            angularOutput: `<img class='a b' />`,
            html: `<img class='b a' />`,
            htmlOutput: `<img class='a b' />`,
            jsx: `() => <img class='b a' />`,
            jsxOutput: `() => <img class='a b' />`,
            svelte: `<img class='b a' />`,
            svelteOutput: `<img class='a b' />`,
            vue: `<template><img class='b a' /></template>`,
            vueOutput: `<template><img class='a b' /></template>`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            jsx: `() => <img class={\`b a\`} />`,
            jsxOutput: `() => <img class={\`a b\`} />`,
            svelte: `<img class={\`b a\`} />`,
            svelteOutput: `<img class={\`a b\`} />`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            jsx: `() => <img class={"b a"} />`,
            jsxOutput: `() => <img class={"a b"} />`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            jsx: `() => <img class={'b a'} />`,
            jsxOutput: `() => <img class={'a b'} />`,

            errors: 1,
            options: [{ order: "asc" }]
          }
        ]
      }
    );
  });

  it("should keep expressions as they are", () => {
    lint(enforceConsistentClassOrder, {
      valid: [
        {
          jsx: `() => <img class={true ? "b a" : "c b"} />`,
          svelte: `<img class={true ? "b a" : "c b"} />`
        }
      ]
    });
  });

  it("should keep expressions where they are", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          jsx: `() => <img class={\`c a \${true ? "e" : "f"} d b \`} />`,
          jsxOutput: `() => <img class={\`a c \${true ? "e" : "f"} b d \`} />`,
          svelte: `<img class={\`c a \${true ? "e" : "f"} d b \`} />`,
          svelteOutput: `<img class={\`a c \${true ? "e" : "f"} b d \`} />`,

          errors: 2,
          options: [{ order: "asc" }]
        }
      ],
      valid: [
        {
          jsx: `() => <img class={\`a c \${true ? "e" : "f"} b \`} />`,
          svelte: `<img class={\`a c \${true ? "e" : "f"} b \`} />`
        }
      ]
    });
  });

  it("should not rip away sticky classes", () => {

    const expression = "${true ? ' true ' : ' false '}";

    const dirty = `c b a${expression}f e d`;
    const clean = `b c a${expression}f d e`;

    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          jsx: `() => <img class={\`${dirty}\`} />`,
          jsxOutput: `() => <img class={\`${clean}\`} />`,
          svelte: `<img class={\`${dirty}\`} />`,
          svelteOutput: `<img class={\`${clean}\`} />`,

          errors: 2,
          options: [{ order: "asc" }]
        }
      ]
    });
  });

  it("should sort multiline strings but keep the whitespace as it is", () => {
    const unsortedMultilineString = `
      d c
      b a
    `;

    const sortedMultilineString = `
      a b
      c d
    `;

    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="${unsortedMultilineString}" />`,
            angularOutput: `<img class="${sortedMultilineString}" />`,
            html: `<img class="${unsortedMultilineString}" />`,
            htmlOutput: `<img class="${sortedMultilineString}" />`,
            svelte: `<img class="${unsortedMultilineString}" />`,
            svelteOutput: `<img class="${sortedMultilineString}" />`,
            vue: `<template><img class="${unsortedMultilineString}" /></template>`,
            vueOutput: `<template><img class="${sortedMultilineString}" /></template>`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img class='${unsortedMultilineString}' />`,
            angularOutput: `<img class='${sortedMultilineString}' />`,
            html: `<img class='${unsortedMultilineString}' />`,
            htmlOutput: `<img class='${sortedMultilineString}' />`,
            svelte: `<img class='${unsortedMultilineString}' />`,
            svelteOutput: `<img class='${sortedMultilineString}' />`,
            vue: `<template><img class='${unsortedMultilineString}' /></template>`,
            vueOutput: `<template><img class='${sortedMultilineString}' /></template>`,

            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            jsx: `() => <img class={\`${unsortedMultilineString}\`} />`,
            jsxOutput: `() => <img class={\`${sortedMultilineString}\`} />`,
            svelte: `<img class={\`${unsortedMultilineString}\`} />`,
            svelteOutput: `<img class={\`${sortedMultilineString}\`} />`,

            errors: 1,
            options: [{ order: "asc" }]
          }
        ],
        valid: [
          {
            angular: `<img class="${sortedMultilineString}" />`,
            html: `<img class="${sortedMultilineString}" />`,
            svelte: `<img class="${sortedMultilineString}" />`,
            vue: `<template><img class="${sortedMultilineString}" /></template>`,

            options: [{ order: "asc" }]
          },
          {
            angular: `<img class='${sortedMultilineString}' />`,
            html: `<img class='${sortedMultilineString}' />`,
            svelte: `<img class='${sortedMultilineString}' />`,
            vue: `<template><img class='${sortedMultilineString}' /></template>`,

            options: [{ order: "asc" }]
          },
          {
            jsx: `() => <img class={\`${sortedMultilineString}\`} />`,
            svelte: `<img class={\`${sortedMultilineString}\`} />`,

            options: [{ order: "asc" }]
          }
        ]
      }
    );
  });

  it("should sort in string literals in defined call signature arguments", () => {

    const dirtyDefined = "defined('b a d c');";
    const cleanDefined = "defined('a b c d');";
    const dirtyUndefined = "notDefined(\"b a d c\");";

    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`,

            errors: 1,
            options: [{ callees: ["defined"], order: "asc" }]
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            svelte: `<script>${dirtyUndefined}</script>`,
            vue: `<script>${dirtyUndefined}</script>`,

            options: [{ callees: ["defined"], order: "asc" }]
          }
        ]
      }
    );

    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`,

            errors: 1,
            options: [{ callees: ["defined"], order: "asc" }]
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            svelte: `<script>${dirtyUndefined}</script>`,
            vue: `<script>${dirtyUndefined}</script>`,

            options: [{ callees: ["defined"], order: "asc" }]
          }
        ]
      }
    );
  });

  it("should sort in call signature arguments in template literals", () => {

    const dirtyDefined = "${defined('f e')}";
    const cleanDefined = "${defined('e f')}";
    const dirtyUndefined = "${notDefined('f e')}";

    const dirtyDefinedMultiline = `
      b a
      d c ${dirtyDefined} h g
      j i
    `;
    const cleanDefinedMultiline = `
      a b
      c d ${cleanDefined} g h
      i j
    `;
    const dirtyUndefinedMultiline = `
      b a
      d c ${dirtyUndefined} h g
      j i
    `;
    const cleanUndefinedMultiline = `
      a b
      c d ${dirtyUndefined} g h
      i j
    `;

    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            jsx: `() => <img class={\`${dirtyDefinedMultiline}\`} />`,
            jsxOutput: `() => <img class={\`${cleanDefinedMultiline}\`} />`,
            svelte: `<img class={\`${dirtyDefinedMultiline}\`} />`,
            svelteOutput: `<img class={\`${cleanDefinedMultiline}\`} />`,

            errors: 3,
            options: [{ callees: ["defined"], order: "asc" }]
          },
          {
            jsx: `() => <img class={\`${dirtyUndefinedMultiline}\`} />`,
            jsxOutput: `() => <img class={\`${cleanUndefinedMultiline}\`} />`,
            svelte: `<img class={\`${dirtyUndefinedMultiline}\`} />`,
            svelteOutput: `<img class={\`${cleanUndefinedMultiline}\`} />`,

            errors: 2,
            options: [{ callees: ["defined"], order: "asc" }]
          }
        ]
      }
    );

  });

  it("should sort in matching variable declarations", () => {

    const dirtyDefined = "const defined = \"b a\";";
    const cleanDefined = "const defined = \"a b\";";
    const dirtyUndefined = "const notDefined = \"b a\";";

    const dirtyMultiline = `const defined = \`
      b a
      d c
    \`;`;

    const cleanMultiline = `const defined = \`
      a b
      c d
    \`;`;

    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`,

            errors: 1,
            options: [{ order: "asc", variables: ["defined"] }]
          },
          {
            jsx: dirtyMultiline,
            jsxOutput: cleanMultiline,
            svelte: `<script>${dirtyMultiline}</script>`,
            svelteOutput: `<script>${cleanMultiline}</script>`,
            vue: `<script>${dirtyMultiline}</script>`,
            vueOutput: `<script>${cleanMultiline}</script>`,

            errors: 1,
            options: [{ order: "asc", variables: ["defined"] }]
          }
        ],
        valid: [
          {
            jsx: dirtyUndefined,
            svelte: `<script>${dirtyUndefined}</script>`,
            vue: `<script>${dirtyUndefined}</script>`,

            options: [{ order: "asc" }]
          }
        ]
      }
    );

  });

  it("should sort simple class names in tagged template literals", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            jsx: "defined`b a`",
            jsxOutput: "defined`a b`",
            svelte: "<script>defined`b a`</script>",
            svelteOutput: "<script>defined`a b`</script>",
            vue: "defined`b a`",
            vueOutput: "defined`a b`",

            errors: 1,
            options: [{ order: "asc", tags: ["defined"] }]
          }
        ],
        valid: [
          {
            jsx: "defined`a b`",
            svelte: "<script>defined`a b`</script>",
            vue: "defined`a b`",

            options: [{ order: "asc", tags: ["defined"] }]
          }
        ]
      }
    );
  });

  it("should group variants together in the `strict` sorting order", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          angular: `<img class="hover:text-black text-black hover:dark:text-black" />`,
          angularOutput: `<img class="text-black hover:text-black hover:dark:text-black" />`,
          html: `<img class="hover:text-black text-black hover:dark:text-black" />`,
          htmlOutput: `<img class="text-black hover:text-black hover:dark:text-black" />`,
          jsx: `() => <img class="hover:text-black text-black hover:dark:text-black" />`,
          jsxOutput: `() => <img class="text-black hover:text-black hover:dark:text-black" />`,
          svelte: `<img class="hover:text-black text-black hover:dark:text-black" />`,
          svelteOutput: `<img class="text-black hover:text-black hover:dark:text-black" />`,
          vue: `<template><img class="hover:text-black text-black hover:dark:text-black" /></template>`,
          vueOutput: `<template><img class="text-black hover:text-black hover:dark:text-black" /></template>`,

          errors: 1,
          options: [{ order: "strict" }]
        }
      ]
    });
  });

  it("should group arbitrary variants together in the `strict` sorting order", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          jsx: `<img class="data-[attr=a]:*:text-black text-black data-[attr=a]:text-black" />`,
          jsxOutput: `<img class="text-black data-[attr=a]:text-black data-[attr=a]:*:text-black" />`,

          errors: 1,
          options: [{ order: "strict" }]
        }
      ]
    });
  });

  it("should sort arbitrary variants last in the `strict` sorting order", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          jsx: `<img class="data-[attr=a]:*:text-black data-[attr=a]:text-black text-black md:dark:text-black md:text-black" />`,
          jsxOutput: `<img class="text-black md:text-black md:dark:text-black data-[attr=a]:text-black data-[attr=a]:*:text-black" />`,

          errors: 1,
          options: [{ order: "strict" }]
        }
      ]
    });
  });

  it("should sort based on the official order in `strict` sorting order", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            jsx: `<img class="data-[attr=a]:*:text-black text-white px-4 block mix-blend-difference py-2 data-[attr=a]:text-black" />`,
            jsxOutput: `<img class="block px-4 py-2 text-white mix-blend-difference data-[attr=a]:text-black data-[attr=a]:*:text-black" />`,

            errors: 1,
            options: [{ order: "strict" }]
          }
        ]
      }
    );
  });

  it("should sort unknown classes to the start by default", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="flex unknown" />`,
            angularOutput: `<img class="unknown flex" />`,
            html: `<img class="flex unknown" />`,
            htmlOutput: `<img class="unknown flex" />`,
            jsx: `() => <img class="flex unknown" />`,
            jsxOutput: `() => <img class="unknown flex" />`,
            svelte: `<img class="flex unknown" />`,
            svelteOutput: `<img class="unknown flex" />`,
            vue: `<template><img class="flex unknown" /></template>`,
            vueOutput: `<template><img class="unknown flex" /></template>`,

            errors: 1
          }
        ]
      }
    );
  });

  it("should sort unknown classes alphabetically in a locale-independent way", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="flex cy-24 cx-12" />`,
            angularOutput: `<img class="cx-12 cy-24 flex" />`,
            html: `<img class="flex cy-24 cx-12" />`,
            htmlOutput: `<img class="cx-12 cy-24 flex" />`,
            jsx: `() => <img class="flex cy-24 cx-12" />`,
            jsxOutput: `() => <img class="cx-12 cy-24 flex" />`,
            svelte: `<img class="flex cy-24 cx-12" />`,
            svelteOutput: `<img class="cx-12 cy-24 flex" />`,
            vue: `<template><img class="flex cy-24 cx-12" /></template>`,
            vueOutput: `<template><img class="cx-12 cy-24 flex" /></template>`,

            errors: 1,
            options: [{ order: "official", unknownClassOrder: "asc", unknownClassPosition: "start" }]
          },
          {
            angular: `<img class="flex cx-12 cy-24" />`,
            angularOutput: `<img class="flex cy-24 cx-12" />`,
            html: `<img class="flex cx-12 cy-24" />`,
            htmlOutput: `<img class="flex cy-24 cx-12" />`,
            jsx: `() => <img class="flex cx-12 cy-24" />`,
            jsxOutput: `() => <img class="flex cy-24 cx-12" />`,
            svelte: `<img class="flex cx-12 cy-24" />`,
            svelteOutput: `<img class="flex cy-24 cx-12" />`,
            vue: `<template><img class="flex cx-12 cy-24" /></template>`,
            vueOutput: `<template><img class="flex cy-24 cx-12" /></template>`,

            errors: 1,
            options: [{ order: "official", unknownClassOrder: "desc", unknownClassPosition: "end" }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should sort component classes to the start by default in tailwind >= 4", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="flex custom-component" />`,
            angularOutput: `<img class="custom-component flex" />`,
            html: `<img class="flex custom-component" />`,
            htmlOutput: `<img class="custom-component flex" />`,
            jsx: `() => <img class="flex custom-component" />`,
            jsxOutput: `() => <img class="custom-component flex" />`,
            svelte: `<img class="flex custom-component" />`,
            svelteOutput: `<img class="custom-component flex" />`,
            vue: `<template><img class="flex custom-component" /></template>`,
            vueOutput: `<template><img class="custom-component flex" /></template>`,

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
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should sort component classes alphabetically in a locale-independent way in tailwind >= 4", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="flex cy-24 cx-12" />`,
            angularOutput: `<img class="cx-12 cy-24 flex" />`,
            html: `<img class="flex cy-24 cx-12" />`,
            htmlOutput: `<img class="cx-12 cy-24 flex" />`,
            jsx: `() => <img class="flex cy-24 cx-12" />`,
            jsxOutput: `() => <img class="cx-12 cy-24 flex" />`,
            svelte: `<img class="flex cy-24 cx-12" />`,
            svelteOutput: `<img class="cx-12 cy-24 flex" />`,
            vue: `<template><img class="flex cy-24 cx-12" /></template>`,
            vueOutput: `<template><img class="cx-12 cy-24 flex" /></template>`,

            errors: 1,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";
                
                @layer components {
                  .cx-12, .cy-24 {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              componentClassOrder: "asc",
              componentClassPosition: "start",
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          },
          {
            angular: `<img class="flex cx-12 cy-24" />`,
            angularOutput: `<img class="flex cy-24 cx-12" />`,
            html: `<img class="flex cx-12 cy-24" />`,
            htmlOutput: `<img class="flex cy-24 cx-12" />`,
            jsx: `() => <img class="flex cx-12 cy-24" />`,
            jsxOutput: `() => <img class="flex cy-24 cx-12" />`,
            svelte: `<img class="flex cx-12 cy-24" />`,
            svelteOutput: `<img class="flex cy-24 cx-12" />`,
            vue: `<template><img class="flex cx-12 cy-24" /></template>`,
            vueOutput: `<template><img class="flex cy-24 cx-12" /></template>`,

            errors: 1,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";
                
                @layer components {
                  .cx-12, .cy-24 {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              componentClassOrder: "desc",
              componentClassPosition: "end",
              detectComponentClasses: true,
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should differentiate between custom component classes and unknown classes in tailwind >= 4", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="g d h flex c b i a h-full k e w-full f j" />`,
            angularOutput: `<img class="a b c d e f flex h-full w-full k j i h g" />`,
            html: `<img class="g d h flex c b i a h-full k e w-full f j" />`,
            htmlOutput: `<img class="a b c d e f flex h-full w-full k j i h g" />`,
            jsx: `() => <img class="g d h flex c b i a h-full k e w-full f j" />`,
            jsxOutput: `() => <img class="a b c d e f flex h-full w-full k j i h g" />`,
            svelte: `<img class="g d h flex c b i a h-full k e w-full f j" />`,
            svelteOutput: `<img class="a b c d e f flex h-full w-full k j i h g" />`,
            vue: `<template><img class="g d h flex c b i a h-full k e w-full f j" /></template>`,
            vueOutput: `<template><img class="a b c d e f flex h-full w-full k j i h g" /></template>`,

            errors: 1,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";
                
                @layer components {
                  .a, .b, .c, .d, .e, .f {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              componentClassOrder: "asc",
              componentClassPosition: "start",
              detectComponentClasses: true,
              entryPoint: "./tailwind.css",
              unknownClassOrder: "desc",
              unknownClassPosition: "end"
            }]
          }
        ]
      }
    );
  });

  it.runIf(getTailwindCSSVersion().major >= 4)("should be possible to move both custom component classes and unknown classes to the end and preserve the order in tailwind >= 4", () => {
    lint(
      enforceConsistentClassOrder,
      {
        invalid: [
          {
            angular: `<img class="g d h flex c b i a w-full k e h-full f j" />`,
            angularOutput: `<img class="flex h-full w-full g h i k j d c b a e f" />`,
            html: `<img class="g d h flex c b i a w-full k e h-full f j" />`,
            htmlOutput: `<img class="flex h-full w-full g h i k j d c b a e f" />`,
            jsx: `() => <img class="g d h flex c b i a w-full k e h-full f j" />`,
            jsxOutput: `() => <img class="flex h-full w-full g h i k j d c b a e f" />`,
            svelte: `<img class="g d h flex c b i a w-full k e h-full f j" />`,
            svelteOutput: `<img class="flex h-full w-full g h i k j d c b a e f" />`,
            vue: `<template><img class="g d h flex c b i a w-full k e h-full f j" /></template>`,
            vueOutput: `<template><img class="flex h-full w-full g h i k j d c b a e f" /></template>`,

            errors: 1,

            files: {
              "tailwind.css": css`
                @import "tailwindcss";
                
                @layer components {
                  .a, .b, .c, .d, .e, .f {
                    @apply font-bold;
                  }
                }
              `
            },
            options: [{
              componentClassOrder: "preserve",
              componentClassPosition: "end",
              detectComponentClasses: true,
              entryPoint: "./tailwind.css",
              unknownClassOrder: "preserve",
              unknownClassPosition: "end"
            }]
          }
        ]
      }
    );
  });

});
