import { $ } from "readable-tailwind:build:utils.js";
import { describe, expect, it } from "vitest";

describe("e2e/commonjs", async () => {
  it("should report all errors", async () => {
    const json = await $`
      cd ${import.meta.dirname} > /dev/null &&
      npm i > /dev/null &&
      npx eslint --config eslint.config.js --no-config-lookup --format json .
    `

    expect(JSON.parse(json.toString())[1]).toMatchObject({
      "errorCount": 0,
      "fatalErrorCount": 0,
      "fixableErrorCount": 0,
      "fixableWarningCount": 2,
      "warningCount": 2 
    });
  })
})