import { describe, expect, it } from "vitest";

import { getClassProperties } from "./class-properties.async.v4.js";


describe("getClassProperties", () => {
  it("should collect the properties of all nested declarations and ignore `@property` rules", () => {
    const tailwindContext = {
      compileAstNodes: () => [{
        node: {
          kind: "rule",
          nodes: [
            { kind: "declaration", property: "box-shadow", value: "var(--tw-shadow)" },
            { kind: "at-rule", name: "@media", nodes: [{ kind: "declaration", property: "--tw-shadow", value: "0 1px" }] },
            { kind: "at-rule", name: "@property", nodes: [{ kind: "declaration", property: "syntax", value: "\"*\"" }] },
            { kind: "declaration", property: "color", value: undefined }
          ]
        }
      }],
      parseCandidate: () => [{ variants: [] }]
    };

    expect(getClassProperties(tailwindContext, ["shadow-md"])).toEqual({
      "shadow-md": ["--tw-shadow", "box-shadow"]
    });
  });

  it("should compile classes without their variants", () => {
    const compiledCandidates: unknown[] = [];
    const tailwindContext = {
      compileAstNodes: (candidate: unknown) => {
        compiledCandidates.push(candidate);
        return [];
      },
      parseCandidate: () => [{ root: "flex", variants: [{ kind: "static", root: "before" }] }]
    };

    getClassProperties(tailwindContext, ["before:flex"]);

    expect(compiledCandidates).toEqual([{ root: "flex", variants: [] }]);
  });

  it.each(["__proto__", "constructor", "toString"])("should return undefined for %s if it doesn't set any properties", className => {
    const tailwindContext = {
      compileAstNodes: () => [],
      parseCandidate: () => []
    };

    const classProperties = getClassProperties(tailwindContext, [className]);

    for(const result of [classProperties, structuredClone(classProperties)]){
      expect(Object.keys(result)).toEqual([className]);
      expect(result[className]).toBeUndefined();
    }
  });
});
