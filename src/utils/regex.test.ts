import { describe, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


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
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 3,
              jsx: dirtyDefined,
              jsxOutput: cleanDefined,
              options: [{
                callees: [
                  [
                    "defined\\(([^)]*)\\)",
                    "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                  ]
                ]
              }],
              svelte: `<script>${dirtyDefined}</script>`,
              svelteOutput: `<script>${cleanDefined}</script>`,
              vue: `<script>${dirtyDefined}</script>`,
              vueOutput: `<script>${cleanDefined}</script>`
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
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 3,
              jsx: dirtyDefined,
              jsxOutput: cleanDefined,
              options: [{
                variables: [
                  [
                    "defined = ([\\S\\s]*)",
                    "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                  ]
                ]
              }],
              svelte: `<script>${dirtyDefined}</script>`,
              svelteOutput: `<script>${cleanDefined}</script>`,
              vue: `<script>${dirtyDefined}</script>`,
              vueOutput: `<script>${cleanDefined}</script>`
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
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 3,
              jsx: `<img defined={${dirtyDefined}} />`,
              jsxOutput: `<img defined={${cleanDefined}} />`,
              options: [{
                attributes: [
                  [
                    "defined={([\\S\\s]*)}",
                    "\"matched\"?:\\s*[\"'`]([^\"'`]+)[\"'`]"
                  ]
                ]
              }],
              svelte: `<img defined={${dirtyDefined}} />`,
              svelteOutput: `<img defined={${cleanDefined}} />`
            }
          ]
        }
      );

    });

  });

  describe("template literal tags", () => {

    it("should lint literals in tagged template literals", () => {
      lint(
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 1,
              jsx: "defined`  a  b  `",
              jsxOutput: "defined`a b`",
              options: [{
                tags: [
                  [
                    "defined`([\\S\\s]*)`",
                    `(.*)`
                  ]
                ]
              }],
              svelte: `<script>defined\`  a  b  \`</script>`,
              svelteOutput: `<script>defined\`a b\`</script>`,
              vue: `defined\`  a  b  \``,
              vueOutput: `defined\`a b\``
            }
          ],
          valid: [
            {
              jsx: "notDefined`  a  b  `",
              options: [{
                tags: [
                  [
                    "defined`([\\S\\s]*)`",
                    `(.*)`
                  ]
                ]
              }],
              svelte: `<script>notDefined\`  a  b  \`</script>`,
              vue: `notDefined\`  a  b  \``
            }
          ]
        }
      );

    });

  });

});
