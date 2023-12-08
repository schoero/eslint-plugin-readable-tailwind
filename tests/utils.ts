import { RuleTester } from "eslint";

import type { RuleOptions } from "src/types/options.js";


type RuleTesterParameters = Parameters<RuleTester["run"]>;

const ruleTester = new RuleTester({
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2015 }
});

type Test = RuleTesterParameters[2] & {

};

export function lint<const Name extends keyof RuleOptions>(
  name: Name,
  rule: RuleTesterParameters[1],
  tests: Omit<RuleTesterParameters[2], "invalid" | "valid"> & {
    invalid?: (Omit<RuleTester.InvalidTestCase, "options"> & {
      options?: RuleOptions[Name];
    })[];
    valid?: (Omit<RuleTester.ValidTestCase, "options"> & {
      options?: RuleOptions[Name];
    })[];
  }
) {

  ruleTester.run(name, rule, {
    ...tests,
    invalid: tests.invalid ?? [],
    valid: tests.valid ?? []
  });

}
