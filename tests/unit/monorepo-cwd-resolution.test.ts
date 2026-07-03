import { loadESLint } from "eslint";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import eslintPluginBetterTailwindCSS from "better-tailwindcss:configs/config.js";
import { TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";
import { TestDirectory } from "better-tailwindcss:tests/utils/tmp.js";


// Simulates a monorepo where:
// ./           <-- linter cwd (no tailwindcss here)
// ./packages/website/node_modules/tailwindcss/  <-- installed here
// ./packages/website/src/index.tsx  <-- file being linted

describe("monorepo cwd resolution", async () => {
  let fs: TestDirectory;

  beforeEach(() => {
    fs = new TestDirectory({
      "packages/website/node_modules/tailwindcss/index.css": "",
      "packages/website/node_modules/tailwindcss/package.json": JSON.stringify({
        name: "tailwindcss",
        style: "index.css",
        version: "4.0.0"
      }),
      "packages/website/node_modules/tailwindcss/theme.css": "",
      "packages/website/src/global.css": "",
      "packages/website/src/index.jsx": /* tsx */`
        export default () => <div class=" flex " />;
      `
    }, true);
  });

  afterEach(() => {
    fs.cleanUp();
  });

  const ESLint = await loadESLint();

  it("should resolve tailwindcss from the explicitly configured cwd", async () => {
    const linter = new ESLint({
      cwd: fs.directory,
      overrideConfig: {
        ...TEST_SYNTAXES.jsx,
        files: ["**/*.jsx"],
        plugins: {
          "better-tailwindcss": eslintPluginBetterTailwindCSS
        },
        rules: {
          "better-tailwindcss/no-unnecessary-whitespace": "warn"
        },
        settings: {
          "better-tailwindcss": {
            cwd: "packages/website/"
          }
        }
      },
      overrideConfigFile: true
    });

    const results = await linter.lintFiles(fs.files["packages/website/src/index.jsx"].path);

    expect(results).toHaveLength(1);
    expect(results[0].messages).toHaveLength(2);
    expect(results[0].messages[0].ruleId).toBe("better-tailwindcss/no-unnecessary-whitespace");
    expect(results[0].messages[1].ruleId).toBe("better-tailwindcss/no-unnecessary-whitespace");
  });

});
