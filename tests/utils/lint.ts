import { readdirSync } from "node:fs";
import { normalize } from "node:path";

import eslintParserAngular from "@angular-eslint/template-parser";
import css from "@eslint/css";
import eslintParserHTML from "@html-eslint/parser";
import * as eslintParserAstro from "astro-eslint-parser";
import { RuleTester as ESLintRuleTester } from "eslint";
import { RuleTester as OxlintRuleTester } from "oxlint/plugins-dev";
import eslintParserSvelte from "svelte-eslint-parser";
import { tailwind4 } from "tailwind-csstree";
import eslintParserVue from "vue-eslint-parser";

import { TestDirectory } from "better-tailwindcss:tests/utils/tmp.js";
import { getNodeVersion } from "better-tailwindcss:tests/utils/version.js";
import { clearCache } from "better-tailwindcss:utils/cache.js";

import type { ESLint } from "eslint";
import type { Node as ESNode } from "estree";

import type { CommonOptions } from "better-tailwindcss:options/descriptions.js";
import type { Context, ESLintRule } from "better-tailwindcss:types/rule.js";


export const TEST_SYNTAXES = {
  angular: {
    languageOptions: { parser: eslintParserAngular }
  },
  astro: {
    languageOptions: { parser: eslintParserAstro }
  },
  css: {
    language: "css/css",
    languageOptions: {
      customSyntax: tailwind4,
      tolerant: true
    },
    plugins: { css: css as unknown as ESLint.Plugin }
  },
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

type Syntaxes = typeof TEST_SYNTAXES;

const LINTERS = {
  eslint: {
    RuleTester: ESLintRuleTester,
    syntaxes: {
      angular: TEST_SYNTAXES.angular,
      astro: TEST_SYNTAXES.astro,
      css: TEST_SYNTAXES.css,
      html: TEST_SYNTAXES.html,
      jsx: TEST_SYNTAXES.jsx,
      svelte: TEST_SYNTAXES.svelte,
      vue: TEST_SYNTAXES.vue
    }
  },
  ...getNodeVersion().major >= 22 && {
    oxlint: {
      RuleTester: OxlintRuleTester,
      syntaxes: {
        jsx: TEST_SYNTAXES.jsx
      }
    }
  }
} as const;

export function lint<const Rule extends ESLintRule>(
  eslintRule: Rule,
  tests: {
    invalid?: (
      {
        [Key in keyof Syntaxes]?: string;
      } & {
        [Key in keyof Syntaxes as `${Key & string}Output`]?: string;
      } & {
        errors: { message: string; }[] | number;
      } & {
        files?: Record<string, string>;
        options?: [Partial<CommonOptions & Context<Rule>["options"]>];
        settings?: Record<string, Partial<CommonOptions>>;
      }
    )[];
    valid?: (
      {
        [Key in keyof Syntaxes]?: string;
      } & {
        files?: Record<string, string>;
        options?: [Partial<CommonOptions & Context<Rule>["options"]>];
        settings?: Record<string, Partial<CommonOptions>>;
      }
    )[];
  }
) {

  for(const invalid of tests.invalid ?? []){

    clearCache();

    using _ = new TestDirectory(invalid.files);

    for(const { RuleTester, syntaxes } of Object.values(LINTERS)){
      for(const [name, options] of Object.entries(syntaxes)){

        const ruleTester = new RuleTester(options) as ESLintRuleTester;

        if(!invalid[name]){
          continue;
        }

        ruleTester.run(eslintRule.name, eslintRule.rule, {
          invalid: [{
            code: invalid[name],
            errors: invalid.errors,
            options: invalid.options ?? [],
            output: invalid[`${name}Output`] ?? null,
            settings: invalid.settings ?? {}
          }],
          valid: []
        });
      }
    }
  }

  for(const valid of tests.valid ?? []){

    clearCache();

    using _ = new TestDirectory(valid.files);

    for(const { RuleTester, syntaxes } of Object.values(LINTERS)){
      for(const [name, options] of Object.entries(syntaxes)){

        const ruleTester = new RuleTester(options) as ESLintRuleTester;

        if(!valid[name]){
          continue;
        }

        ruleTester.run(eslintRule.name, eslintRule.rule, {
          invalid: [],
          valid: [{
            code: valid[name],
            options: valid.options ?? [],
            settings: valid.settings ?? {}
          }]
        });
      }

    }
  }

}

type GuardedType<Type> = Type extends (value: any) => value is infer ResultType ? ResultType : never;

export function findNode<Matcher extends (node: unknown) => node is any>(node: unknown, matcherFunction: Matcher): GuardedType<Matcher> | undefined {
  if(!node || typeof node !== "object"){
    return;
  }

  for(const key in node){
    const value = node[key];

    if(!value || typeof value !== "object" || key === "parent"){
      continue;
    }

    if(matcherFunction(value)){
      return value;
    }

    const foundNode = findNode(value, matcherFunction);

    if(foundNode){
      return foundNode;
    }
  }
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

export function getFilesInDirectory(importURL: string) {
  const path = normalize(importURL);
  const files = readdirSync(path);

  return files.filter(file => !file.includes(".test.ts"));
}
