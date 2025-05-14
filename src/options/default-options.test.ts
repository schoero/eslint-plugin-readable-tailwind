import { describe, expect, it } from "vitest";

import { DEFAULT_CALLEE_NAMES } from "better-tailwindcss:options:default-options.js";
import { getFilesInDirectory } from "better-tailwindcss:tests:utils.js";


describe("default options", () => {

  it("should include all callees by default", () => {
    const callees = DEFAULT_CALLEE_NAMES
      .map(callee => callee[0])
      .filter((callee, index, arr) => arr.indexOf(callee) === index);

    const exportedFiles = getFilesInDirectory("./src/options/callees/");
    const fileNames = exportedFiles.map(file => file.replace(".ts", ""));

    expect(callees.sort()).toStrictEqual(fileNames.sort());

  });

});
