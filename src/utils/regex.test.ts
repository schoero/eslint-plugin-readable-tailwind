import { lint, TEST_SYNTAXES } from "tests/utils.js";
import { describe, it } from "vitest";

import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";


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

  describe("class attributes", () => {

    it("should lint literals in class attributes", () => {

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
                classAttributes: [
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

});
