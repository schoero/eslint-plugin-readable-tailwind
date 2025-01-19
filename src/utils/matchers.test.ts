import { parse } from "espree";
import { describe, expect, it } from "vitest";

import {
  hasESNodeParentExtension,
  isESObjectKey,
  isESStringLike,
  isInsideObjectValue
} from "readable-tailwind:parsers:es.js";
import { tailwindNoUnnecessaryWhitespace } from "readable-tailwind:rules:tailwind-no-unnecessary-whitespace.js";
import { findNode, lint, TEST_SYNTAXES, withParentNodeExtension } from "readable-tailwind:tests:utils.js";
import { MatcherType } from "readable-tailwind:types:rule.js";
import { getObjectPath } from "readable-tailwind:utils:matchers.js";

import type { Node as ESNode } from "estree";


describe("matchers", () => {
  describe("getObjectPath", () => {

    {

      const code = `const obj = {
        root: {
          nested: {
            value: "value"
          }
        }
      };`;

      it("should return the correct object path for keys", () => {

        const ast = withParentNodeExtension(parse(code, { ecmaVersion: "latest" }) as ESNode);

        const root = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "root";
        });

        const nested = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "nested";
        });

        const value = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "value";
        });

        expect(getObjectPath(root[0])).toBe("root");
        expect(getObjectPath(nested[0])).toBe("root.nested");
        expect(getObjectPath(value[0])).toBe("root.nested.value");

      });

      it("should return the correct object path for values", () => {

        const ast = withParentNodeExtension(parse(code, { ecmaVersion: "latest" }) as ESNode);

        const value = findNode(ast, (node: ESNode) => {
          return isESStringLike(node) && isInsideObjectValue(node);
        });

        const path = getObjectPath(value[0]);
        expect(path).toBe("root.nested.value");

      });

      it("should put names in quotes if they are not valid identifiers", () => {

        const code = `const obj = {
            "root-key": {
              "1nested": {
                "deeply_nested_value": "value"
              }
            }
          };`;

        const ast = withParentNodeExtension(parse(code, { ecmaVersion: "latest" }) as ESNode);

        const root = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Literal" && node.value === "root-key";
        });

        const nested = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Literal" && node.value === "1nested";
        });

        const value = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Literal" && node.value === "deeply_nested_value";
        });

        expect(getObjectPath(root[0])).toBe(`["root-key"]`);
        expect(getObjectPath(nested[0])).toBe(`["root-key"]["1nested"]`);
        expect(getObjectPath(value[0])).toBe(`["root-key"]["1nested"].deeply_nested_value`);

      });
    }

    {

      const code = `const obj = {
        root: [
          {
            value1: "value1"
          },
          {
            value2: "value2"
          }
        ]
      };`;

      it("should return the correct index in arrays", () => {

        const ast = withParentNodeExtension(parse(code, { ecmaVersion: "latest" }) as ESNode);

        const value1 = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "value1";
        });

        const value2 = findNode(ast, (node: ESNode) => {
          return hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "value2";
        });

        expect(getObjectPath(value1[0])).toBe("root[0].value1");
        expect(getObjectPath(value2[0])).toBe("root[1].value2");

      });

    }

  });

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
                    "defined",
                    [
                      {
                        match: MatcherType.ObjectValue,
                        pathPattern: "^matched|\\.matched"
                      }
                    ]
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

    it("should match callees names via regex", () => {
      lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            errors: 1,
            jsx: `testStyles(" lint ");`,
            jsxOutput: `testStyles("lint");`,
            options: [{
              callees: [["^.*Styles$", [{ match: MatcherType.String }]]]
            }],
            svelte: `<script>testStyles(" lint ");</script>`,
            svelteOutput: `<script>testStyles("lint");</script>`,
            vue: `<script>testStyles(" lint ");</script>`,
            vueOutput: `<script>testStyles("lint");</script>`
          }
        ]
      });
    });

    it("should match variable names via regex", () => {
      lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            errors: 1,
            jsx: `const testStyles = " lint ";`,
            jsxOutput: `const testStyles = "lint";`,
            options: [{
              variables: [["^.*Styles$", [{ match: MatcherType.String }]]]
            }],
            svelte: `<script>const testStyles = " lint ";</script>`,
            svelteOutput: `<script>const testStyles = "lint";</script>`,
            vue: `<script>const testStyles = " lint ";</script>`,
            vueOutput: `<script>const testStyles = "lint";</script>`
          }
        ]
      });
    });

    it("should match classAttributes via regex", () => {
      lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            errors: 1,
            jsx: `<img testStyles=" lint " />`,
            jsxOutput: `<img testStyles="lint" />`,
            options: [{
              classAttributes: [["^.*Styles$", [{ match: MatcherType.String }]]]
            }],
            svelte: `<img testStyles=" lint " />`,
            svelteOutput: `<img testStyles="lint" />`,
            vue: `<template><img testStyles=" lint " /> </template>`,
            vueOutput: `<template><img testStyles="lint" /> </template>`
          }
        ]
      });
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
                    "defined",
                    [
                      {
                        match: MatcherType.ObjectValue,
                        pathPattern: "^matched|\\.matched"
                      }
                    ]
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
                    "defined",
                    [
                      {
                        match: MatcherType.ObjectValue,
                        pathPattern: "^matched|\\.matched"
                      }
                    ]
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

    it("should lint class names in tagged template literals when matched using the strings matcher", () => {
      lint(
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 1,
              jsx: "defined`  lint  lint  `",
              jsxOutput: "defined`lint lint`",
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }],
              svelte: "<script>defined`  lint  lint  `</script>",
              svelteOutput: "<script>defined`lint lint`</script>",
              vue: "defined`  lint  lint  `",
              vueOutput: "defined`lint lint`"
            }
          ]
        }
      );
    });

    it("should lint class names in nested literal expressions inside tagged template literals when matched using the strings matcher", () => {
      // eslint thinks the fixes are conflicting so it only applies the first iteration
      lint(
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 3,
              jsx: "defined` lint ${\"  lint  lint  \"} lint `",
              jsxOutput: "defined`lint ${\"  lint  lint  \"} lint`",
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }],
              svelte: "<script>defined` lint ${\"  lint  lint  \"} lint `</script>",
              svelteOutput: "<script>defined`lint ${\"  lint  lint  \"} lint`</script>",
              vue: "defined` lint ${\"  lint  lint  \"} lint `",
              vueOutput: "defined`lint ${\"  lint  lint  \"} lint`"
            }
          ],
          valid: [
            {
              jsx: "notDefined` lint ${\"  lint  lint  \"} lint `",
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }],
              svelte: "<script>notDefined` lint ${\"  lint  lint  \"} lint `</script>",
              vue: "notDefined` lint ${\"  lint  lint  \"} lint `"
            }
          ]
        }
      );
      lint(
        tailwindNoUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              errors: 1,
              jsx: "defined`lint ${\"  lint  lint  \"} lint`",
              jsxOutput: "defined`lint ${\"lint lint\"} lint`",
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }],
              svelte: "<script>defined`lint ${\"  lint  lint  \"} lint`</script>",
              svelteOutput: "<script>defined`lint ${\"lint lint\"} lint`</script>",
              vue: "defined`lint ${\"  lint  lint  \"} lint`",
              vueOutput: "defined`lint ${\"lint lint\"} lint`"
            }
          ],
          valid: [
            {
              jsx: "notDefined`lint ${\"  lint  lint  \"} lint`",
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }],
              svelte: "<script>notDefined`lint ${\"  lint  lint  \"} lint`</script>",
              vue: "notDefined`lint ${\"  lint  lint  \"} lint`"
            }
          ]
        }
      );
    });

  });

  it("should lint literals inside object keys when matched", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: "defined({ \" lint \": \" ignore \" })",
          jsxOutput: "defined({ \"lint\": \" ignore \" })",
          options: [{
            callees: [["defined", [{ match: MatcherType.ObjectKey }]]]
          }],
          svelte: "<script>defined({ \" lint \": \" ignore \" })</script>",
          svelteOutput: "<script>defined({ \"lint\": \" ignore \" })</script>",
          vue: "defined({ \" lint \": \" ignore \" })",
          vueOutput: "defined({ \"lint\": \" ignore \" })"
        }
      ]
    });
  });

  it("should lint literals inside object values when matched", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: "defined({ \" ignore \": \" lint \" })",
          jsxOutput: "defined({ \" ignore \": \"lint\" })",
          options: [{
            callees: [["defined", [{ match: MatcherType.ObjectValue }]]]
          }],
          svelte: "<script>defined({ \" ignore \": \" lint \" })</script>",
          svelteOutput: "<script>defined({ \" ignore \": \"lint\" })</script>",
          vue: "defined({ \" ignore \": \" lint \" })",
          vueOutput: "defined({ \" ignore \": \"lint\" })"
        }
      ]
    });
  });

  it("should lint only strings not matched by other matchers", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: "defined(\" lint \", { \" ignore \": \" ignore \" }, [\" lint \"])",
          jsxOutput: "defined(\"lint\", { \" ignore \": \" ignore \" }, [\"lint\"])",
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]]
          }],
          svelte: "<script>defined(\" lint \", { \" ignore \": \" ignore \" }, [\" lint \"])</script>",
          svelteOutput: "<script>defined(\"lint\", { \" ignore \": \" ignore \" }, [\"lint\"])</script>",
          vue: "defined(\" lint \", { \" ignore \": \" ignore \" }, [\" lint \"])",
          vueOutput: "defined(\"lint\", { \" ignore \": \" ignore \" }, [\"lint\"])"
        }
      ]
    });
  });

  it("should lint strings inside template literal expressions when matched using the strings matcher", () => {
    // eslint thinks the fixes are conflicting so it only applies the first iteration
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 3,
          jsx: "defined(` lint ${\" lint \"} lint `)",
          jsxOutput: "defined(`lint ${\" lint \"} lint`)",
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]]
          }],
          svelte: "<script>defined(` lint ${\" lint \"} lint `)</script>",
          svelteOutput: "<script>defined(`lint ${\" lint \"} lint`)</script>",
          vue: "defined(` lint ${\" lint \"} lint `)",
          vueOutput: "defined(`lint ${\" lint \"} lint`)"
        }
      ]
    });
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: "defined(`lint ${\" lint \"} lint`)",
          jsxOutput: "defined(`lint ${\"lint\"} lint`)",
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]]
          }],
          svelte: "<script>defined(`lint ${\" lint \"} lint`)</script>",
          svelteOutput: "<script>defined(`lint ${\"lint\"} lint`)</script>",
          vue: "defined(`lint ${\" lint \"} lint`)",
          vueOutput: "defined(`lint ${\"lint\"} lint`)"
        }
      ]
    });
  });

  it("should not double report if multiple matchers match the same literal", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          jsx: "defined({ \" lint \": \" lint \" })",
          jsxOutput: "defined({ \"lint\": \"lint\" })",
          options: [{
            callees: [["defined", [{ match: MatcherType.ObjectKey }, { match: MatcherType.ObjectValue }]]]
          }]
        }
      ]
    });
  });

  it("should still handle callees even when they are object values", () => {
    lint(tailwindNoUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          jsx: "<img class={{ key: defined('  a b c  ')}} />",
          jsxOutput: "<img class={{ key: defined('a b c')}} />",
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]],
            classAttributes: [["class", [{ match: MatcherType.ObjectValue }]]]
          }]
        }
      ]
    });
  });

});
