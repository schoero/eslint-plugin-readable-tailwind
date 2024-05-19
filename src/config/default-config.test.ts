import { getFilesInDirectory } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import { DEFAULT_CALLEE_NAMES } from "readable-tailwind:config:default-config.js";


describe("default config", () => {

  it("should include all callees by default", () => {
    const callees = DEFAULT_CALLEE_NAMES
      .map(callee => callee[0])
      .filter((callee, index, arr) => arr.indexOf(callee) === index);

    console.log(callees.sort().join());

    const exportedFiles = getFilesInDirectory("./src/config/callees/");
    const fileNames = exportedFiles.map(file => file.replace(".ts", ""));

    expect(callees.sort()).toEqual(fileNames.sort());

  });

});
