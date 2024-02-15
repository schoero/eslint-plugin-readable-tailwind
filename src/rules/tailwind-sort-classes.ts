import { resolve } from "node:path";

import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "src/parsers/html.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "src/parsers/vue.js";
import defaultConfig from "tailwindcss/defaultConfig.js";
import setupContextUtils from "tailwindcss/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss/loadConfig.js";
import resolveConfig from "tailwindcss/resolveConfig.js";

import { getLiteralsByESCallExpression } from "readable-tailwind:parsers:es.js";
import { getJSXAttributes, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "readable-tailwind:parsers:svelte.js";
import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "readable-tailwind:utils:config.js";
import { splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { Node } from "estree";
import type { CallExpression, JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { Config } from "tailwindcss/types/config.js";
import type { VStartTag } from "vue-eslint-parser/ast";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { Callees, ESLintRule } from "readable-tailwind:types:rule.js";


export type Options = [
  {
    callees?: Callees;
    classAttributes?: string[];
    order?: "asc" | "desc" | "improved" | "official" ;
    tailwindConfig?: string;
  }
];

export const tailwindSortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create(ctx) {

      const { callees, classAttributes } = getOptions(ctx);

      const tailwindConfig = findTailwindConfig(ctx);
      const tailwindContext = createTailwindContext(tailwindConfig);

      const lintLiterals = (ctx: Rule.RuleContext, literals: Literal[]) => {

        for(const literal of literals){

          const classChunks = splitClasses(literal.content);
          const whitespaceChunks = splitWhitespaces(literal.content);
          const sortedClassChunks = sortClasses(ctx, tailwindContext, classChunks);

          const classes: string[] = [];

          for(let i = 0; i < Math.max(sortedClassChunks.length, whitespaceChunks.length); i++){
            whitespaceChunks[i] && classes.push(whitespaceChunks[i]);
            sortedClassChunks[i] && classes.push(sortedClassChunks[i]);
          }

          const fixedClasses = [
            literal.openingQuote ?? "",
            literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
            ...classes,
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
          ...ctx.parserServices.defineTemplateBodyVisitor(vue)
        };
      }

      return {
        ...callExpression,
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
              description: "List of function names whose arguments should also be considered.",
              items: {
                oneOf: [
                  {
                    description: "List of function names whose arguments should also be considered.",
                    items: [
                      { type: "string" },
                      { type: "string" }
                    ],
                    type: "array"
                  },
                  {
                    description: "List of function names whose arguments should also be considered.",
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
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};


export function sortClasses(ctx: Rule.RuleContext, tailwindContext: TailwindContext, classes: string[]): string[] {

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

function findTailwindConfig(ctx: Rule.RuleContext) {

  const { tailwindConfig } = getOptions(ctx);

  let userConfig: Config | undefined;

  userConfig = tailwindConfig
    ? loadTailwindConfig(resolve(ctx.cwd, tailwindConfig))
    : undefined;

  userConfig ??= loadTailwindConfig(resolve(ctx.cwd, "tailwind.config.js"));
  userConfig ??= loadTailwindConfig(resolve(ctx.cwd, "tailwind.config.ts"));

  return userConfig
    ? resolveConfig(userConfig)
    : resolveConfig(defaultConfig);

}

function loadTailwindConfig(path: string) {
  try {
    return loadConfig(path);
  } catch (error){}
}

export function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const order = options.order ?? "improved";
  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;

  const tailwindConfig = options.tailwindConfig;

  return {
    callees,
    classAttributes,
    order,
    tailwindConfig
  };

}

interface TailwindContext {
  getClassOrder(classes: string[]): [className: string, order: bigint | null][];
  tailwindConfig: Config;
}

function createTailwindContext(tailwindConfig: ReturnType<typeof resolveConfig>): TailwindContext {
  return setupContextUtils.createContext(tailwindConfig);
}
