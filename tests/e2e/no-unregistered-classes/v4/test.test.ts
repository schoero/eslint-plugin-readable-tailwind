import { loadESLint } from "eslint";
import { getTailwindcssVersion } from "src/tailwind/utils/version.js";
import { describe, expect, it } from "vitest";


describe.skipIf(getTailwindcssVersion().major < 4)("e2e/no-unregistered-classes/v4", async () => {
  it("should not report on registered utility classes", async () => {
    const ESLint = await loadESLint({ useFlatConfig: true });

    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: "./eslint.config.js"
    });

    const [json] = await eslint.lintFiles("./test.html");

    expect(json.errorCount).toBe(0);
    expect(json.fatalErrorCount).toBe(0);
    expect(json.fixableErrorCount).toBe(0);
    expect(json.fixableWarningCount).toBe(0);
    expect(json.warningCount).toBe(1);

    expect(json.messages.map(({ ruleId }) => ruleId)).toEqual([
      "better-tailwindcss/no-unregistered-classes"
    ]);

  });
});
