// @ts-expect-error - types not available yet
import { FlatRuleTester } from "eslint/use-at-your-own-risk";
import eslintParserSvelte from "svelte-eslint-parser";
import eslintParserVue from "vue-eslint-parser";

import eslintParserHTML from "@html-eslint/parser";

import type { ESLintRule } from "src/types/rule.js";


export const TEST_SYNTAXES = {
  html: {
    languageOptions: { parser: eslintParserHTML }
  },
  jsx: {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }
  },
  svelte: {
    languageOptions: { parser: eslintParserSvelte }
  },
  vue: {
    languageOptions: { parser: eslintParserVue }
  }
} as const;


export function lint<Rule extends ESLintRule, Syntaxes extends Record<string, unknown>>(
  eslintRule: Rule,
  syntaxes: Syntaxes,
  tests: {
    invalid?: (
      // Omit<FlatRuleTester.InvalidTestCase, "code" | "options" | "output"> &
      {
        [Key in keyof Syntaxes as `${Key & string}Output`]?: string;
      } & {
        [Key in keyof Syntaxes]?: string;
      } & {
        errors: number;
      } & {
        options?: Rule["options"];
      }
    )[];
    valid?: (
      // Omit<FlatRuleTester.ValidTestCase, "code" | "options" | "output"> &
      {
        [Key in keyof Syntaxes]?: string;
      } & {
        options?: Rule["options"];
      }
    )[];
  }
) {

  for(const invalid of tests.invalid ?? []){
    for(const syntax of Object.keys(syntaxes)){

      const ruleTester = new FlatRuleTester(syntaxes[syntax]);

      if(!invalid[syntax] || !invalid[`${syntax}Output`]){
        continue;
      }

      ruleTester.run(eslintRule.name, eslintRule.rule, {
        invalid: [{
          code: invalid[syntax],
          errors: invalid.errors,
          options: invalid.options ?? [],
          output: invalid[`${syntax}Output`]
        }],
        valid: []
      });
    }
  }

  for(const valid of tests.valid ?? []){
    for(const syntax of Object.keys(syntaxes)){

      const ruleTester = new FlatRuleTester(syntaxes[syntax]);

      if(!valid[syntax]){
        continue;
      }

      ruleTester.run(eslintRule.name, eslintRule.rule, {
        invalid: [],
        valid: [{
          code: valid[syntax],
          options: valid.options ?? []
        }]
      });
    }
  }

}
