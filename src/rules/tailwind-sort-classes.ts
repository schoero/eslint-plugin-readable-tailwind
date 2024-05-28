import { resolve } from "node:path";

import defaultConfig from "tailwindcss/defaultConfig.js";
import * as setupContextUtils from "tailwindcss/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss/loadConfig.js";
import resolveConfig from "tailwindcss/resolveConfig.js";

import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";
import {
  getCalleeSchema,
  getClassAttributeSchema,
  getVariableSchema
} from "readable-tailwind:options:descriptions.js";
import { getLiteralsByESCallExpression, getLiteralsByESVariableDeclarator } from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "readable-tailwind:parsers:html.js";
import { getAttributesByJSXElement, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "readable-tailwind:parsers:vue.js";
import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";
import { splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node, VariableDeclarator } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { Config } from "tailwindcss/types/config.js";
import type { AST } from "vue-eslint-parser";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { CalleeOption, ClassAttributeOption, ESLintRule, VariableOption } from "readable-tailwind:types:rule.js";


export type Options = [
  Partial<
    CalleeOption &
    ClassAttributeOption &
    VariableOption &
    {
      order?: "asc" | "desc" | "improved" | "official" ;
      tailwindConfig?: string;
    }
  >
];

const TAILWIND_CONFIG_CACHE = new Map<string, ReturnType<typeof resolveConfig<Config>>>();
const TAILWIND_CONTEXT_CACHE = new Map<ReturnType<typeof resolveConfig>, TailwindContext>();

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

          const escapedClasses = escapeNestedQuotes(
            [
              unsortableClasses[0],
              ...classes,
              unsortableClasses[1]
            ].join(""),
            literal.openingQuote ?? '"'
          );

          const fixedClasses =
            [
              literal.openingQuote ?? "",
              literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
              escapedClasses,
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
            message: "Incorrect class order: \"{{ notSorted }}\"."
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
          const jsxAttributes = getAttributesByJSXElement(ctx, jsxNode);

          for(const attribute of jsxAttributes){
            const literals = getLiteralsByJSXClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const svelte = {
        SvelteStartTag(node: Node) {
          const svelteNode = node as unknown as SvelteStartTag;
          const svelteAttributes = getAttributesBySvelteTag(ctx, svelteNode);

          for(const attribute of svelteAttributes){
            const literals = getLiteralsBySvelteClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const vue = {
        VStartTag(node: Node) {
          const vueNode = node as unknown as AST.VStartTag;
          const vueAttributes = getAttributesByVueStartTag(ctx, vueNode);

          for(const attribute of vueAttributes){
            const literals = getLiteralsByVueClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const html = {
        Tag(node: Node) {
          const htmlNode = node as unknown as TagNode;
          const htmlAttributes = getAttributesByHTMLTag(ctx, htmlNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getLiteralsByHTMLClassAttribute(ctx, htmlAttribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      // Vue
      if(typeof ctx.sourceCode.parserServices?.defineTemplateBodyVisitor === "function"){
        return {
          // script tag
          ...callExpression,
          ...variableDeclarators,

          // bound classes
          ...ctx.sourceCode.parserServices.defineTemplateBodyVisitor({
            ...callExpression,
            ...vue
          })
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
            ...getCalleeSchema(getOptions().callees),
            ...getClassAttributeSchema(getOptions().classAttributes),
            ...getVariableSchema(getOptions().variables),
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

  let userConfig: Config | undefined;

  userConfig ??= tailwindConfig
    ? loadTailwindConfig(resolve(directory, tailwindConfig))
    : undefined;

  userConfig ??= loadTailwindConfig(resolve(directory, "tailwind.config.js"));
  userConfig ??= loadTailwindConfig(resolve(directory, "tailwind.config.ts"));

  if(userConfig){
    const loadedConfig = resolveConfig(userConfig);
    TAILWIND_CONFIG_CACHE.set(cacheKey, loadedConfig);
    return loadedConfig;
  }

  const parentDirectory = resolve(directory, "..");

  if(directory === parentDirectory){
    return resolveConfig(defaultConfig);
  }

  return findTailwindConfig(ctx, parentDirectory);

}

function loadTailwindConfig(path: string) {
  try {
    return loadConfig(path);
  } catch (error){}
}

export function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const order = options.order ?? "improved";
  const classAttributes = options.classAttributes ?? DEFAULT_ATTRIBUTE_NAMES;
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
  tailwindConfig: Config;
}

function createTailwindContext(tailwindConfig: ReturnType<typeof resolveConfig>): TailwindContext {
  if(TAILWIND_CONTEXT_CACHE.has(tailwindConfig)){
    return TAILWIND_CONTEXT_CACHE.get(tailwindConfig)!;
  }

  const createContext = setupContextUtils.createContext ?? setupContextUtils.default.createContext;

  const context = createContext(tailwindConfig);
  TAILWIND_CONTEXT_CACHE.set(tailwindConfig, context);
  return context;
}
