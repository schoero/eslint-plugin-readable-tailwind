import { parse } from "espree";
import { assert, describe, expect, it } from "vitest";

import {
  getESObjectPath,
  hasESNodeParentExtension,
  isESNode,
  isESObjectKey,
  isESStringLike,
  isInsideObjectValue
} from "better-tailwindcss:parsers/es.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { findNode, lint, TEST_SYNTAXES, withParentNodeExtension } from "better-tailwindcss:tests/utils/lint.js";
import { MatcherType } from "better-tailwindcss:types/rule.js";

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

        const root = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "root";
        });

        const nested = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "nested";
        });

        const value = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "value";
        });

        assert(root);
        assert(nested);
        assert(value);

        expect(getESObjectPath(root)).toBe("root");
        expect(getESObjectPath(nested)).toBe("root.nested");
        expect(getESObjectPath(value)).toBe("root.nested.value");

      });

      it("should return the correct object path for values", () => {

        const ast = withParentNodeExtension(parse(code, { ecmaVersion: "latest" }) as ESNode);

        const value = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && isESStringLike(node) && isInsideObjectValue(node);
        });

        assert(value);

        const path = getESObjectPath(value);
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

        const root = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Literal" && node.value === "root-key";
        });

        const nested = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Literal" && node.value === "1nested";
        });

        const value = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Literal" && node.value === "deeply_nested_value";
        });

        assert(root);
        assert(nested);
        assert(value);

        expect(getESObjectPath(root)).toBe(`["root-key"]`);
        expect(getESObjectPath(nested)).toBe(`["root-key"]["1nested"]`);
        expect(getESObjectPath(value)).toBe(`["root-key"]["1nested"].deeply_nested_value`);

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

        const value1 = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "value1";
        });

        const value2 = findNode(ast, (node): node is ESNode => {
          return isESNode(node) && hasESNodeParentExtension(node) && isESObjectKey(node) && node.type === "Identifier" && node.name === "value2";
        });

        assert(value1);
        assert(value2);

        expect(getESObjectPath(value1)).toBe("root[0].value1");
        expect(getESObjectPath(value2)).toBe("root[1].value2");

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
                    "defined",
                    [
                      {
                        match: MatcherType.ObjectValue,
                        pathPattern: "^matched|\\.matched"
                      }
                    ]
                  ]
                ]
              }]
            }
          ]
        }
      );

    });

    it("should match callees names via regex", () => {
      lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            jsx: `testStyles(" lint ");`,
            jsxOutput: `testStyles("lint");`,
            svelte: `<script>testStyles(" lint ");</script>`,
            svelteOutput: `<script>testStyles("lint");</script>`,
            vue: `<script>testStyles(" lint ");</script>`,
            vueOutput: `<script>testStyles("lint");</script>`,

            errors: 1,
            options: [{
              callees: [["^.*Styles$", [{ match: MatcherType.String }]]]
            }]
          }
        ]
      });
    });

    it("should match variable names via regex", () => {
      lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            jsx: `const testStyles = " lint ";`,
            jsxOutput: `const testStyles = "lint";`,
            svelte: `<script>const testStyles = " lint ";</script>`,
            svelteOutput: `<script>const testStyles = "lint";</script>`,
            vue: `<script>const testStyles = " lint ";</script>`,
            vueOutput: `<script>const testStyles = "lint";</script>`,

            errors: 1,
            options: [{
              variables: [["^.*Styles$", [{ match: MatcherType.String }]]]
            }]
          }
        ]
      });
    });

    it("should match attributes via regex", () => {
      lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
        invalid: [
          {
            jsx: `<img testStyles=" lint " />`,
            jsxOutput: `<img testStyles="lint" />`,
            svelte: `<img testStyles=" lint " />`,
            svelteOutput: `<img testStyles="lint" />`,
            vue: `<template><img testStyles=" lint " /> </template>`,
            vueOutput: `<template><img testStyles="lint" /> </template>`,

            errors: 1,
            options: [{
              attributes: [["^.*Styles$", [{ match: MatcherType.String }]]]
            }]
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
                    "defined",
                    [
                      {
                        match: MatcherType.ObjectValue,
                        pathPattern: "^matched|\\.matched"
                      }
                    ]
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
                    "defined",
                    [
                      {
                        match: MatcherType.ObjectValue,
                        pathPattern: "^matched|\\.matched"
                      }
                    ]
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

    it("should lint class names in tagged template literals when matched using the strings matcher", () => {
      lint(
        noUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              jsx: "defined`  lint  lint  `",
              jsxOutput: "defined`lint lint`",
              svelte: "<script>defined`  lint  lint  `</script>",
              svelteOutput: "<script>defined`lint lint`</script>",
              vue: "defined`  lint  lint  `",
              vueOutput: "defined`lint lint`",

              errors: 1,
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }]
            }
          ]
        }
      );
    });

    it("should lint class names in nested literal expressions inside tagged template literals when matched using the strings matcher", () => {
      // eslint thinks the fixes are conflicting so it only applies the first iteration
      lint(
        noUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              jsx: "defined` lint ${\"  lint  lint  \"} lint `",
              jsxOutput: "defined`lint ${\"  lint  lint  \"} lint`",
              svelte: "<script>defined` lint ${\"  lint  lint  \"} lint `</script>",
              svelteOutput: "<script>defined`lint ${\"  lint  lint  \"} lint`</script>",
              vue: "defined` lint ${\"  lint  lint  \"} lint `",
              vueOutput: "defined`lint ${\"  lint  lint  \"} lint`",

              errors: 3,
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }]
            }
          ],
          valid: [
            {
              jsx: "notDefined` lint ${\"  lint  lint  \"} lint `",
              svelte: "<script>notDefined` lint ${\"  lint  lint  \"} lint `</script>",
              vue: "notDefined` lint ${\"  lint  lint  \"} lint `",

              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }]
            }
          ]
        }
      );
      lint(
        noUnnecessaryWhitespace,
        TEST_SYNTAXES,
        {
          invalid: [
            {
              jsx: "defined`lint ${\"  lint  lint  \"} lint`",
              jsxOutput: "defined`lint ${\"lint lint\"} lint`",
              svelte: "<script>defined`lint ${\"  lint  lint  \"} lint`</script>",
              svelteOutput: "<script>defined`lint ${\"lint lint\"} lint`</script>",
              vue: "defined`lint ${\"  lint  lint  \"} lint`",
              vueOutput: "defined`lint ${\"lint lint\"} lint`",

              errors: 1,
              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }]
            }
          ],
          valid: [
            {
              jsx: "notDefined`lint ${\"  lint  lint  \"} lint`",
              svelte: "<script>notDefined`lint ${\"  lint  lint  \"} lint`</script>",
              vue: "notDefined`lint ${\"  lint  lint  \"} lint`",

              options: [{ tags: [["defined", [{ match: MatcherType.String }]]] }]
            }
          ]
        }
      );
    });

  });

  it("should lint literals inside object keys when matched", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "defined({ \" lint \": \" ignore \" })",
          jsxOutput: "defined({ \"lint\": \" ignore \" })",
          svelte: "<script>defined({ \" lint \": \" ignore \" })</script>",
          svelteOutput: "<script>defined({ \"lint\": \" ignore \" })</script>",
          vue: "defined({ \" lint \": \" ignore \" })",
          vueOutput: "defined({ \"lint\": \" ignore \" })",

          errors: 1,
          options: [{
            callees: [["defined", [{ match: MatcherType.ObjectKey }]]]
          }]
        }
      ]
    });
  });

  it("should lint literals inside object values when matched", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "defined({ \" ignore \": \" lint \" })",
          jsxOutput: "defined({ \" ignore \": \"lint\" })",
          svelte: "<script>defined({ \" ignore \": \" lint \" })</script>",
          svelteOutput: "<script>defined({ \" ignore \": \"lint\" })</script>",
          vue: "defined({ \" ignore \": \" lint \" })",
          vueOutput: "defined({ \" ignore \": \"lint\" })",

          errors: 1,
          options: [{
            callees: [["defined", [{ match: MatcherType.ObjectValue }]]]
          }]
        }
      ]
    });
  });

  it("should lint only strings not matched by other matchers", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "defined(\" lint \", { \" ignore \": \" ignore \" }, [\" lint \"])",
          jsxOutput: "defined(\"lint\", { \" ignore \": \" ignore \" }, [\"lint\"])",
          svelte: "<script>defined(\" lint \", { \" ignore \": \" ignore \" }, [\" lint \"])</script>",
          svelteOutput: "<script>defined(\"lint\", { \" ignore \": \" ignore \" }, [\"lint\"])</script>",
          vue: "defined(\" lint \", { \" ignore \": \" ignore \" }, [\" lint \"])",
          vueOutput: "defined(\"lint\", { \" ignore \": \" ignore \" }, [\"lint\"])",

          errors: 2,
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]]
          }]
        }
      ]
    });
  });

  it("should lint strings inside template literal expressions when matched using the strings matcher", () => {
    // eslint thinks the fixes are conflicting so it only applies the first iteration
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "defined(` lint ${\" lint \"} lint `)",
          jsxOutput: "defined(`lint ${\" lint \"} lint`)",
          svelte: "<script>defined(` lint ${\" lint \"} lint `)</script>",
          svelteOutput: "<script>defined(`lint ${\" lint \"} lint`)</script>",
          vue: "defined(` lint ${\" lint \"} lint `)",
          vueOutput: "defined(`lint ${\" lint \"} lint`)",

          errors: 3,
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]]
          }]
        }
      ]
    });
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "defined(`lint ${\" lint \"} lint`)",
          jsxOutput: "defined(`lint ${\"lint\"} lint`)",
          svelte: "<script>defined(`lint ${\" lint \"} lint`)</script>",
          svelteOutput: "<script>defined(`lint ${\"lint\"} lint`)</script>",
          vue: "defined(`lint ${\" lint \"} lint`)",
          vueOutput: "defined(`lint ${\"lint\"} lint`)",

          errors: 1,
          options: [{
            callees: [["defined", [{ match: MatcherType.String }]]]
          }]
        }
      ]
    });
  });

  it("should not double report if multiple matchers match the same literal", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "defined({ \" lint \": \" lint \" })",
          jsxOutput: "defined({ \"lint\": \"lint\" })",

          errors: 2,
          options: [{
            callees: [["defined", [{ match: MatcherType.ObjectKey }, { match: MatcherType.ObjectValue }]]]
          }]
        }
      ]
    });
  });

  it("should still handle callees even when they are object values", () => {
    lint(noUnnecessaryWhitespace, TEST_SYNTAXES, {
      invalid: [
        {
          jsx: "<img class={{ key: defined('  a b c  ')}} />",
          jsxOutput: "<img class={{ key: defined('a b c')}} />",

          errors: 1,
          options: [{
            attributes: [["class", [{ match: MatcherType.ObjectValue }]]],
            callees: [["defined", [{ match: MatcherType.String }]]]
          }]
        }
      ]
    });
  });

});
