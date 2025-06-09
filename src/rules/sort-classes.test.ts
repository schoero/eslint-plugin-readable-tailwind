import { describe, it } from "vitest";

import { sortClasses } from "better-tailwindcss:rules/sort-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe(sortClasses.name, () => {

  it("should sort simple class names in string literals by the defined order", () => {
    lint(
      sortClasses,
      TEST_SYNTAXES,
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

  it("should group all classes with the same variant together", () => {
    lint(sortClasses, TEST_SYNTAXES, {
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
      sortClasses,
      TEST_SYNTAXES,
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
    lint(sortClasses, TEST_SYNTAXES, {
      valid: [
        {
          jsx: `() => <img class={true ? "b a" : "c b"} />`,
          svelte: `<img class={true ? "b a" : "c b"} />`
        }
      ]
    });
  });

  it("should keep expressions where they are", () => {
    lint(sortClasses, TEST_SYNTAXES, {
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

    lint(sortClasses, TEST_SYNTAXES, {
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
      sortClasses,
      TEST_SYNTAXES,
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
      sortClasses,
      TEST_SYNTAXES,
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
      sortClasses,
      TEST_SYNTAXES,
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

  it("should sort in string literals in call signature arguments matched by a regex", () => {

    const dirtyDefined = `defined(
      "b a",
      {
        "nested": {
          "matched": "b a",
        },
        "deeply": {
          "nested": {
            "unmatched": "b a",
            "matched": "b a"
          },
        },
        "multiline": {
          "matched": \`
            d a
            b c
          \`
        }
      }
    );`;

    const cleanDefined = `defined(
      "a b",
      {
        "nested": {
          "matched": "a b",
        },
        "deeply": {
          "nested": {
            "unmatched": "b a",
            "matched": "a b"
          },
        },
        "multiline": {
          "matched": \`
            a b
            c d
          \`
        }
      }
    );`;

    lint(
      sortClasses,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            jsx: dirtyDefined,
            jsxOutput: cleanDefined,
            svelte: `<script>${dirtyDefined}</script>`,
            svelteOutput: `<script>${cleanDefined}</script>`,
            vue: `<script>${dirtyDefined}</script>`,
            vueOutput: `<script>${cleanDefined}</script>`,

            errors: 4,
            options: [{
              callees: [
                [
                  "defined\\(([^)]*)\\)",
                  "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                ],
                [
                  "defined\\(([^)]*)\\)",
                  "^\\s*[\"'`]([^\"'`]+)[\"'`](?!:)"
                ]
              ],
              order: "asc"
            }]
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
      sortClasses,
      TEST_SYNTAXES,
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
      sortClasses,
      TEST_SYNTAXES,
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

  it("should sort in matching variable declarations matched by a regex", () => {

    const dirtyDefined = "const defined = \"b a\";";
    const cleanDefined = "const defined = \"a b\";";
    const dirtyUndefined = "const notDefined = \"b a\";";

    const dirtyObject = `const defined = {
      "matched": "b a",
      "unmatched": "b a",
      "nested": {
        "matched": "b a",
        "unmatched": "b a"
      }
    };`;

    const cleanObject = `const defined = {
      "matched": "a b",
      "unmatched": "b a",
      "nested": {
        "matched": "a b",
        "unmatched": "b a"
      }
    };`;

    const dirtyMultiline = `const defined = \`
      b a
      d c
    \`;`;

    const cleanMultiline = `const defined = \`
      a b
      c d
    \`;`;

    lint(
      sortClasses,
      TEST_SYNTAXES,
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
            options: [{
              order: "asc",
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "^\\s*[\"'`]([^\"'`]+)[\"'`]"
                ]
              ]
            }]
          },
          {
            jsx: dirtyObject,
            jsxOutput: cleanObject,
            svelte: `<script>${dirtyObject}</script>`,
            svelteOutput: `<script>${cleanObject}</script>`,
            vue: `<script>${dirtyObject}</script>`,
            vueOutput: `<script>${cleanObject}</script>`,

            errors: 2,
            options: [{
              order: "asc",
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                ]
              ]
            }]
          },
          {
            jsx: dirtyMultiline,
            jsxOutput: cleanMultiline,
            svelte: `<script>${dirtyMultiline}</script>`,
            svelteOutput: `<script>${cleanMultiline}</script>`,
            vue: `<script>${dirtyMultiline}</script>`,
            vueOutput: `<script>${cleanMultiline}</script>`,

            errors: 1,
            options: [{
              order: "asc",
              variables: [
                [
                  "defined = ([\\S\\s]*)",
                  "^\\s*['`\"]([^'`]+)['`\"]"
                ]
              ]
            }]
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
      sortClasses,
      TEST_SYNTAXES,
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

});
