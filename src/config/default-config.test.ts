import { deepEqual } from "node:assert";
import { describe, it } from "node:test";

import { DEFAULT_CALLEE_NAMES } from "readable-tailwind:config:default-config.js";
import { getFilesInDirectory } from "readable-tailwind:tests:utils.js";


describe("default config", () => {

  it("should include all callees by default", () => {
    const callees = DEFAULT_CALLEE_NAMES
      .map(callee => callee[0])
      .filter((callee, index, arr) => arr.indexOf(callee) === index);

    const exportedFiles = getFilesInDirectory("./src/config/callees/");
    const fileNames = exportedFiles.map(file => file.replace(".ts", ""));

    deepEqual(callees.sort(), fileNames.sort());

  });

});
