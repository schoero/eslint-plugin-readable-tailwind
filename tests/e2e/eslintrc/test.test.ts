import { loadESLint } from "eslint9";
import { describe, expect, it } from "vitest";


describe("e2e/eslintrc", async () => {
  it("should report all errors", async () => {
    const ESLint = await loadESLint({ useFlatConfig: false });

    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: "./.eslintrc.json"
    });

    const [json] = await eslint.lintFiles("./test.html");

    expect(json.errorCount).toBe(0);
    expect(json.fatalErrorCount).toBe(0);
    expect(json.fixableErrorCount).toBe(0);
    expect(json.fixableWarningCount).toBe(4);
    expect(json.warningCount).toBe(4);

    expect(json.messages.map(({ ruleId }) => ruleId)).toEqual([
      "better-tailwindcss/enforce-consistent-class-order",
      "better-tailwindcss/enforce-consistent-line-wrapping",
      "better-tailwindcss/no-unnecessary-whitespace",
      "better-tailwindcss/no-duplicate-classes"
    ]);

  });
});
