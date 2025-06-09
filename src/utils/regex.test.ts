import { describe, it } from "vitest";

import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("regex", () => {

  describe("callees", () => {

    it("should lint literals in call expressions", () => {

      const dirtyDefined = `defined({
        "nested": {
          "matched": "  b  a  ",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "  b  a  "
          },
        },
        "multiline": {
          "matched": \`
            d  a
            b  c
          \`
        }
      });`;

      const cleanDefined = `defined({
        "nested": {
          "matched": "b a",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "b a"
          },
        },
        "multiline": {
          "matched": \`
            d a
            b c
          \`
        }
      });`;

      lint(
        noUnnecessaryWhitespace,
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

              errors: 3,
              options: [{
                callees: [
                  [
                    "defined\\(([^)]*)\\)",
                    "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                  ]
                ]
              }]
            }
          ]
        }
      );

    });

  });

  describe("variables", () => {

    it("should lint literals in variables", () => {

      const dirtyDefined = `const defined = {
        "nested": {
          "matched": "  b  a  ",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "  b  a  "
          },
        },
        "multiline": {
          "matched": \`
            d  a
            b  c
          \`
        }
      };`;

      const cleanDefined = `const defined = {
        "nested": {
          "matched": "b a",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "b a"
          },
        },
        "multiline": {
          "matched": \`
            d a
            b c
          \`
        }
      };`;

      lint(
        noUnnecessaryWhitespace,
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

              errors: 3,
              options: [{
                variables: [
                  [
                    "defined = ([\\S\\s]*)",
                    "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                  ]
                ]
              }]
            }
          ]
        }
      );

    });

  });

  describe("attributes", () => {

    it("should lint literals in attributes", () => {

      const dirtyDefined = `{
        "nested": {
          "matched": "  b  a  ",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "  b  a  "
          },
        },
        "multiline": {
          "matched": \`
            d  a
            b  c
          \`
        }
      }`;

      const cleanDefined = `{
        "nested": {
          "matched": "b a",
        },
        "deeply": {
          "nested": {
            "unmatched": "  b  a  ",
            "matched": "b a"
          },
        },
        "multiline": {
          "matched": \`
            d a
            b c
          \`
        }
      }`;

      lint(
        noUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              jsx: `<img defined={${dirtyDefined}} />`,
              jsxOutput: `<img defined={${cleanDefined}} />`,
              svelte: `<img defined={${dirtyDefined}} />`,
              svelteOutput: `<img defined={${cleanDefined}} />`,

              errors: 3,
              options: [{
                attributes: [
                  [
                    "defined={([\\S\\s]*)}",
                    "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                  ]
                ]
              }]
            }
          ]
        }
      );

    });

  });

  describe("template literal tags", () => {

    it("should lint literals in tagged template literals", () => {
      lint(
        noUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              jsx: "defined`  a  b  `",
              jsxOutput: "defined`a b`",
              svelte: `<script>defined\`  a  b  \`</script>`,
              svelteOutput: `<script>defined\`a b\`</script>`,
              vue: `defined\`  a  b  \``,
              vueOutput: `defined\`a b\``,

              errors: 1,
              options: [{
                tags: [
                  [
                    "defined`([\\S\\s]*)`",
                    `(.*)`
                  ]
                ]
              }]
            }
          ],
          valid: [
            {
              jsx: "notDefined`  a  b  `",
              svelte: `<script>notDefined\`  a  b  \`</script>`,
              vue: `notDefined\`  a  b  \``,

              options: [{
                tags: [
                  [
                    "defined`([\\S\\s]*)`",
                    `(.*)`
                  ]
                ]
              }]
            }
          ]
        }
      );

    });

  });

});
