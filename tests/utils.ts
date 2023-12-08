import { RuleTester } from "eslint";

import type { ESLintRule } from "src/types/rule.js";


type RuleTesterParameters = Parameters<RuleTester["run"]>;

const ruleTester = new RuleTester({
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2015 }
});

type Test = RuleTesterParameters[2] & {

};

export function lint<Rule extends ESLintRule>(
  eslintRule: Rule,
  tests: Omit<RuleTesterParameters[2], "invalid" | "valid"> & {
    invalid?: (Omit<RuleTester.InvalidTestCase, "options"> & {
      options?: Rule["options"];
    })[];
    valid?: (Omit<RuleTester.ValidTestCase, "options"> & {
      options?: Rule["options"];
    })[];
  }
) {

  ruleTester.run(eslintRule.name, eslintRule.rule, {
    ...tests,
    invalid: tests.invalid ?? [],
    valid: tests.valid ?? []
  });

}
