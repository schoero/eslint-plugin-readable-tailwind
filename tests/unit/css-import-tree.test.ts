import { describe, expect, it, vi } from "vitest";

import { flattenCssImportTree, getCssImportTree } from "better-tailwindcss:utils/css-import-tree.js";

import type { ParseCssFile } from "../../src/async-utils/css-import-tree.js";
import type { AsyncContext } from "../../src/utils/context.js";


function createParseCssFile(files: Record<string, string[]>): ParseCssFile {
  return vi.fn(async (_ctx: AsyncContext, resolvedPath: string) => {
    const imports = files[resolvedPath];
    if(!imports){
      return;
    }
    return { imports: imports.map(path => ({ path })) };
  });
}

describe("css-import-tree", () => {

  it("should return an empty object for a file with no imports", async () => {
    const parseCssFile = createParseCssFile({
      "/project/a.css": []
    });

    const tree = await getCssImportTree({} as AsyncContext, "/project/a.css", parseCssFile);

    expect(tree).toEqual({});
  });

  it("should build a simple chain", async () => {
    const parseCssFile = createParseCssFile({
      "/project/a.css": ["/project/b.css"],
      "/project/b.css": ["/project/c.css"],
      "/project/c.css": []
    });

    const tree = await getCssImportTree({} as AsyncContext, "/project/a.css", parseCssFile);

    expect(tree).toEqual({
      "/project/b.css": {
        "/project/c.css": {}
      }
    });
  });

  it("should handle diamond imports without duplicate recursion", async () => {
    const parseCssFile = createParseCssFile({
      "/project/a.css": ["/project/b.css", "/project/c.css"],
      "/project/b.css": ["/project/d.css"],
      "/project/c.css": ["/project/d.css"],
      "/project/d.css": []
    });

    const tree = await getCssImportTree({} as AsyncContext, "/project/a.css", parseCssFile);

    expect(tree).toEqual({
      "/project/b.css": {
        "/project/d.css": {}
      },
      "/project/c.css": {
        "/project/d.css": {}
      }
    });

    expect(parseCssFile).toHaveBeenCalledTimes(4);
  });

  it("should stop recursion on circular imports", async () => {
    const parseCssFile = createParseCssFile({
      "/project/a.css": ["/project/b.css"],
      "/project/b.css": ["/project/a.css"]
    });

    const tree = await getCssImportTree({} as AsyncContext, "/project/a.css", parseCssFile);

    expect(tree).toEqual({
      "/project/b.css": {
        "/project/a.css": {}
      }
    });

    expect(parseCssFile).toHaveBeenCalledTimes(2);
  });

  it("should skip unresolvable imports", async () => {
    const parseCssFile = createParseCssFile({
      "/project/a.css": ["/project/missing.css"],
      "/project/missing.css": undefined as unknown as string[]
    });

    const tree = await getCssImportTree({} as AsyncContext, "/project/a.css", parseCssFile);

    expect(tree).toEqual({
      "/project/missing.css": {}
    });
  });

  it("should flatten a tree into unique absolute paths", () => {
    const tree = {
      "/project/b.css": {
        "/project/c.css": {}
      },
      "/project/c.css": {}
    };

    expect(flattenCssImportTree(tree)).toEqual([
      "/project/b.css",
      "/project/c.css"
    ]);
  });

});
