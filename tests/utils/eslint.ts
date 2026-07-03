import { ESLint } from "eslint";

import type { Linter } from "eslint";


export async function eslint(
  content: string,
  config: Linter.Config[]
): Promise<string> {
  const eslint = new ESLint({
    baseConfig: config,
    fix: true,
    overrideConfigFile: true
  });

  const [result] = await eslint.lintText(content);

  return result.output ?? content;
}
