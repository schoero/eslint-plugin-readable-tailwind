import { readdirSync } from "node:fs";
import { normalize } from "node:path";

import eslintParserHTML from "@html-eslint/parser";
import { RuleTester } from "eslint";
import { createTag } from "proper-tags";
import eslintParserSvelte from "svelte-eslint-parser";
import { describe, it } from "vitest";
import eslintParserVue from "vue-eslint-parser";

import type { Rule } from "eslint";
import type { Node as ESNode, Program } from "estree";

import type { ESLintRule, MatcherFunction } from "readable-tailwind:types:rule.js";


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
      {
        [Key in keyof Syntaxes as `${Key & string}Output`]?: string;
      } & {
        [Key in keyof Syntaxes]?: string;
      } & {
        errors: number;
      } & {
        options?: Rule["options"];
        settings?: Rule["settings"];
      }
    )[];
    valid?: (
      {
        [Key in keyof Syntaxes]?: string;
      } & {
        options?: Rule["options"];
        settings?: Rule["settings"];
      }
    )[];
  }
) {

  for(const invalid of tests.invalid ?? []){
    for(const syntax of Object.keys(syntaxes)){

      const ruleTester = createRuleTester(syntaxes[syntax], invalid.settings);

      if(!invalid[syntax] || !invalid[`${syntax}Output`]){
        continue;
      }

      ruleTester.run(eslintRule.name, eslintRule.rule, {
        invalid: [{
          code: invalid[syntax],
          errors: invalid.errors,
          options: invalid.options ?? [],
          output: invalid[`${syntax}Output`]!,
          settings: invalid.settings ?? {}
        }],
        valid: []
      });
    }
  }

  for(const valid of tests.valid ?? []){
    for(const syntax of Object.keys(syntaxes)){

      const ruleTester = createRuleTester(syntaxes[syntax], valid.settings);

      if(!valid[syntax]){
        continue;
      }

      ruleTester.run(eslintRule.name, eslintRule.rule, {
        invalid: [],
        valid: [{
          code: valid[syntax],
          options: valid.options ?? [],
          settings: valid.settings ?? {}
        }]
      });

    }
  }

}

export function findNode(node: ESNode | Program, matcherFunction: MatcherFunction): ESNode[] {
  return Object.entries(node).reduce<ESNode[]>((matchedNodes, [key, value]) => {
    if(typeof value !== "object" || key === "parent"){
      return matchedNodes;
    }

    if(matcherFunction(value)){
      matchedNodes.push(value);
    }

    matchedNodes.push(...findNode(value, matcherFunction));
    return matchedNodes;
  }, []);
}

export function withParentNodeExtension(node: ESNode, parent: ESNode = node) {
  for(const key in node){
    if(typeof node[key] === "object" && key !== "parent"){
      if(Array.isArray(node[key])){
        for(const element of node[key]){
          element.parent = parent;
          withParentNodeExtension(element);
        }
      } else {
        node[key].parent = parent;
        withParentNodeExtension(node[key]);
      }
    }
  }
  return node;
}

export function createTrimTag(count: number) {
  return createTag(customIndentStripTransformer(count));
}

function customIndentStripTransformer(count: number) {
  return {
    onEndResult(endResult: string) {
      return endResult.replace(new RegExp(`^ {${count}}`, "gm"), "");
    }
  };
}

function createRuleTester(options: any, settings?: Rule.RuleContext["settings"]) {
  const ruleTester = new RuleTester(options);
  // @ts-expect-error - missing types
  ruleTester.describe = describe;
  // @ts-expect-error - missing types
  ruleTester.it = it;
  // @ts-expect-error - missing types
  ruleTester.itOnly = it.only;
  return ruleTester;

}

export function getFilesInDirectory(importURL: string) {

  const path = normalize(importURL);
  const files = readdirSync(path);

  return files.filter(file => !file.includes(".test.ts"));

}
