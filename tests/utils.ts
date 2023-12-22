import { FlatRuleTester } from "eslint/use-at-your-own-risk";

import type { ESLintRule } from "src/types/rule.js";


type RuleTesterParameters = Parameters<FlatRuleTester["run"]>;

export function lint<Rule extends ESLintRule>(
  eslintRule: Rule,
  tests: Omit<RuleTesterParameters[2], "invalid" | "valid"> & {
    invalid?: (Omit<FlatRuleTester.InvalidTestCase, "options"> & {
      options?: Rule["options"];
    })[];
    valid?: (Omit<FlatRuleTester.ValidTestCase, "options"> & {
      options?: Rule["options"];
    })[];
  },
  languageOptions?: any
) {
  const ruleTester = new FlatRuleTester({
    languageOptions: {
      ...languageOptions,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  });

  ruleTester.run(eslintRule.name, eslintRule.rule, {
    ...tests,
    invalid: tests.invalid ?? [],
    valid: tests.valid ?? []
  });

}
