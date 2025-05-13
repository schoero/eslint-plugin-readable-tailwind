import { loadESLint } from "eslint";
import { describe, expect, it } from "vitest";


describe("e2e/esm", async () => {
  it("should report all errors", async () => {
    const ESLint = await loadESLint({ useFlatConfig: true });

    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: "./eslint.config.js"
    });

    const [json] = await eslint.lintFiles("./test.html");

    expect(json.errorCount).toBe(0);
    expect(json.fatalErrorCount).toBe(0);
    expect(json.fixableErrorCount).toBe(0);
    expect(json.fixableWarningCount).toBe(4);
    expect(json.warningCount).toBe(4);

    expect(json.messages.map(({ ruleId }) => ruleId)).toEqual([
      "readable-tailwind/multiline",
      "readable-tailwind/no-unnecessary-whitespace",
      "readable-tailwind/sort-classes",
      "readable-tailwind/no-duplicate-classes"
    ]);

  });
});
