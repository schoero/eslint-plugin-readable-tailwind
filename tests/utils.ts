import { RuleTester } from "eslint";


const ruleTester = new RuleTester({
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2015 }
});

export function lint(...[name, rule, tests]: Parameters<typeof ruleTester.run>) {
  ruleTester.run(name, rule, {
    invalid: tests.invalid ?? [],
    valid: tests.valid ?? []
  });
}
