import { beforeAll, describe, expect, it } from "vitest";

import { $ } from "readable-tailwind:build:utils.js";


describe("e2e/commonjs", async () => {
  it("should report all errors", async () => {
    const json = await $(
      `npx eslint --config eslint.config.js --no-config-lookup --format json .`,
      { cwd: import.meta.dirname }
    );

    expect(JSON.parse(json.toString())[1]).toMatchObject({
      errorCount: 0,
      fatalErrorCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 1,
      warningCount: 1
    });
  }, 10_000);
});
