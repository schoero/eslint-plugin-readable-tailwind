import { resolve } from "node:path";

// import defaultConfig from "tailwindcss/defaultConfig.js";
// import setupContextUtils from "tailwindcss/lib/lib/setupContextUtils.js";
// import loadConfig from "tailwindcss/loadConfig.js";
// import resolveConfig from "tailwindcss/resolveConfig.js";
// import type { Config } from "tailwindcss/types/config.js";
import { getLiteralsByESCallExpression, getLiteralsByESVariableDeclarator } from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "readable-tailwind:parsers:html.js";
import { getJSXAttributes, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "readable-tailwind:parsers:vue.js";
import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES, DEFAULT_VARIABLE_NAMES } from "readable-tailwind:utils:config.js";
import { splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node, VariableDeclarator } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { VStartTag } from "vue-eslint-parser/ast";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { Callees, ESLintRule, Variables } from "readable-tailwind:types:rule.js";


export type Options = [
  {
    callees?: Callees;
    classAttributes?: string[];
    order?: "asc" | "desc" | "improved" | "official" ;
    tailwindConfig?: string;
    variables?: Variables;
  }
];

const TAILWIND_CONFIG_CACHE = new Map<string, ReturnType<typeof import("tailwindcss/resolveConfig")>>();
const TAILWIND_CONTEXT_CACHE = new Map<ReturnType<typeof import("tailwindcss/resolveConfig")>, TailwindContext>();

export const tailwindSortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create(ctx) {

      const { callees, classAttributes, variables } = getOptions(ctx);

      const tailwindConfig = findTailwindConfig(ctx);
      const tailwindContext = createTailwindContext(tailwindConfig);

      const lintLiterals = (ctx: Rule.RuleContext, literals: Literal[]) => {

        for(const literal of literals){

          const classChunks = splitClasses(literal.content);
          const whitespaceChunks = splitWhitespaces(literal.content);

          const unsortableClasses: [string, string] = ["", ""];

          // remove sticky classes
          if(literal.closingBraces && whitespaceChunks[0] === ""){
            whitespaceChunks.shift();
            unsortableClasses[0] = classChunks.shift() ?? "";
          }
          if(literal.openingBraces && whitespaceChunks[whitespaceChunks.length - 1] === ""){
            whitespaceChunks.pop();
            unsortableClasses[1] = classChunks.pop() ?? "";
          }

          const sortedClassChunks = sortClasses(ctx, tailwindContext, classChunks);

          const classes: string[] = [];

          for(let i = 0; i < Math.max(sortedClassChunks.length, whitespaceChunks.length); i++){
            whitespaceChunks[i] && classes.push(whitespaceChunks[i]);
            sortedClassChunks[i] && classes.push(sortedClassChunks[i]);
          }

          const fixedClasses = [
            literal.openingQuote ?? "",
            literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
            unsortableClasses[0],
            ...classes,
            unsortableClasses[1],
            literal.type === "TemplateLiteral" && literal.openingBraces ? literal.openingBraces : "",
            literal.closingQuote ?? ""
          ].join("");

          if(literal.raw === fixedClasses){
            continue;
          }

          ctx.report({
            data: {
              notSorted: literal.content
            },
            fix(fixer) {
              return fixer.replaceTextRange(literal.range, fixedClasses);
            },
            loc: literal.loc,
            message: "Invalid class order: \"{{ notSorted }}\"."
          });

        }
      };

      const callExpression = {
        CallExpression(node: Node) {
          const callExpressionNode = node as CallExpression;

          const literals = getLiteralsByESCallExpression(ctx, callExpressionNode, callees);
          lintLiterals(ctx, literals);
        }
      };

      const variableDeclarators = {
        VariableDeclarator(node: Node) {
          const variableDeclaratorNode = node as VariableDeclarator;

          const literals = getLiteralsByESVariableDeclarator(ctx, variableDeclaratorNode, variables);
          lintLiterals(ctx, literals);
        }
      };

      const jsx = {
        JSXOpeningElement(node: Node) {
          const jsxNode = node as JSXOpeningElement;
          const jsxAttributes = getJSXAttributes(ctx, classAttributes, jsxNode);

          for(const attribute of jsxAttributes){
            const literals = getLiteralsByJSXClassAttribute(ctx, attribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      const svelte = {
        SvelteStartTag(node: Node) {
          const svelteNode = node as unknown as SvelteStartTag;
          const svelteAttributes = getAttributesBySvelteTag(ctx, classAttributes, svelteNode);

          for(const attribute of svelteAttributes){
            const literals = getLiteralsBySvelteClassAttribute(ctx, attribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      const vue = {
        VStartTag(node: Node) {
          const vueNode = node as unknown as VStartTag;
          const vueAttributes = getAttributesByVueStartTag(ctx, classAttributes, vueNode);

          for(const attribute of vueAttributes){
            const literals = getLiteralsByVueClassAttribute(ctx, attribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      const html = {
        Tag(node: Node) {
          const htmlNode = node as unknown as TagNode;
          const htmlAttributes = getAttributesByHTMLTag(ctx, classAttributes, htmlNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getLiteralsByHTMLClassAttribute(ctx, htmlAttribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      // Vue
      if(typeof ctx.parserServices?.defineTemplateBodyVisitor === "function"){
        return {
          ...callExpression,
          ...variableDeclarators,
          ...ctx.parserServices.defineTemplateBodyVisitor(vue)
        };
      }

      return {
        ...callExpression,
        ...variableDeclarators,
        ...jsx,
        ...svelte,
        ...html
      };

    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce a consistent order for tailwind classes.",
        recommended: true,
        url: "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/sort-classes.md"
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            callees: {
              default: getOptions().callees,
              description: "List of function names whose arguments should also get linted.",
              items: {
                anyOf: [
                  {
                    description: "List of regular expressions that matches string literals that should also get linted.",
                    items: [
                      { description: "Regular expression that filters the callee and matches the string literals in a group.", type: "string" },
                      { description: "Regular expression that matches each string literal in a group.", type: "string" }
                    ],
                    type: "array"
                  },
                  {
                    description: "List of function names whose arguments should also get linted.",
                    type: "string"
                  }
                ]
              },
              type: "array"
            },
            classAttributes: {
              default: getOptions().classAttributes,
              description: "The name of the attribute that contains the tailwind classes.",
              items: {
                type: "string"
              },
              type: "array"
            },
            order: {
              default: getOptions().order,
              description: "The algorithm to use when sorting classes.",
              enum: [
                "asc",
                "desc",
                "official",
                "improved"
              ],
              type: "string"
            },
            tailwindConfig: {
              default: getOptions().tailwindConfig,
              description: "The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.",
              type: "string"
            },
            variables: {
              default: getOptions().variables,
              description: "List of variable names whose values should also get linted.",
              items: {
                anyOf: [
                  {
                    description: "List of regular expressions that matches string literals that should also get linted.",
                    items: [
                      { description: "Regular expression that filters the variable and matches the string literals in a group.", type: "string" },
                      { description: "Regular expression that matches each string literal in a group.", type: "string" }
                    ],
                    type: "array"
                  },
                  {
                    description: "List of variable names whose values should also get linted.",
                    type: "string"
                  }
                ]
              },
              type: "array"
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};


function sortClasses(ctx: Rule.RuleContext, tailwindContext: TailwindContext, classes: string[]): string[] {

  const { order } = getOptions(ctx);

  if(order === "asc"){
    return [...classes].sort((a, b) => a.localeCompare(b));
  }

  if(order === "desc"){
    return [...classes].sort((a, b) => b.localeCompare(a));
  }

  const officialClassOrder = tailwindContext.getClassOrder(classes) as [string, bigint | null][];
  const officiallySortedClasses = [...officialClassOrder]
    .sort(([, a], [, z]) => {
      if(a === z){ return 0; }
      if(a === null){ return 1; }
      if(z === null){ return 1; }
      return +(a - z > 0n) - +(a - z < 0n);
    })
    .map(([className]) => className);

  if(order === "official"){
    return officiallySortedClasses;
  }

  return [...officiallySortedClasses].sort((a, b) => {

    const aModifier = a.match(/^.*?:/)?.[0];
    const bModifier = b.match(/^.*?:/)?.[0];

    if(aModifier && bModifier && aModifier !== bModifier){
      return aModifier.localeCompare(bModifier);
    }

    if(aModifier && !bModifier){
      return 1;
    }
    if(!aModifier && bModifier){
      return -1;
    }

    return 0;

  });

}

function findTailwindConfig(ctx: Rule.RuleContext, directory: string = ctx.cwd) {

  const { tailwindConfig } = getOptions(ctx);

  const cacheKey = JSON.stringify({ config: tailwindConfig, cwd: ctx.cwd });

  if(TAILWIND_CONFIG_CACHE.has(cacheKey)){
    return TAILWIND_CONFIG_CACHE.get(cacheKey)!;
  }

  let userConfig: import("tailwindcss/types/config").Config | undefined;

  userConfig ??= tailwindConfig
    ? loadTailwindConfig(resolve(directory, tailwindConfig))
    : undefined;

  userConfig ??= loadTailwindConfig(resolve(directory, "tailwind.config.js"));
  userConfig ??= loadTailwindConfig(resolve(directory, "tailwind.config.ts"));

  const resolveConfig = require("tailwindcss/resolveConfig.js") as typeof import("tailwindcss/resolveConfig");

  if(userConfig){
    const loadedConfig = resolveConfig(userConfig);
    TAILWIND_CONFIG_CACHE.set(cacheKey, loadedConfig);
    return loadedConfig;
  }

  const parentDirectory = resolve(directory, "..");

  if(directory === parentDirectory){
    const defaultConfig = require("tailwindcss/defaultConfig.js");
    return resolveConfig(defaultConfig);
  }

  return findTailwindConfig(ctx, parentDirectory);

}

function loadTailwindConfig(path: string) {
  try {
    const loadConfig = require("tailwindcss/loadConfig.js") as typeof import("tailwindcss/loadConfig");
    return loadConfig(path);
  } catch (error){}
}

export function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const order = options.order ?? "improved";
  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;
  const variables = options.variables ?? DEFAULT_VARIABLE_NAMES;

  const tailwindConfig = options.tailwindConfig;

  return {
    callees,
    classAttributes,
    order,
    tailwindConfig,
    variables
  };

}

interface TailwindContext {
  getClassOrder(classes: string[]): [className: string, order: bigint | null][];
  tailwindConfig: import("tailwindcss/types/config").Config;
}

function createTailwindContext(tailwindConfig: ReturnType<typeof import("tailwindcss/resolveConfig")>): TailwindContext {
  if(TAILWIND_CONTEXT_CACHE.has(tailwindConfig)){
    return TAILWIND_CONTEXT_CACHE.get(tailwindConfig)!;
  }

  const setupContextUtils = require("tailwindcss/lib/lib/setupContextUtils.js");
  const context = setupContextUtils.createContext(tailwindConfig);
  TAILWIND_CONTEXT_CACHE.set(tailwindConfig, context);
  return context;
}
