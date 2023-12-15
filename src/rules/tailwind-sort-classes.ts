import { resolve } from "node:path";

import defaultConfig from "tailwindcss/defaultConfig.js";
import setupContextUtils from "tailwindcss/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss/loadConfig.js";
import resolveConfig from "tailwindcss/resolveConfig.js";

import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "eptm:utils:config.js";
import { getClassAttributes } from "eptm:utils:jsx";
import { getCallExpressionLiterals, getClassAttributeLiterals } from "eptm:utils:jsx.js";
import { splitClasses, splitWhitespaces } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { ESLintRule } from "src/types/rule.js";
import type { Config } from "tailwindcss/types/config.js";

import type { Literals } from "eptm:utils:jsx.js";


export type Options = [
  {
    callees?: string[];
    classAttributes?: string[];
    order?: "asc" | "desc" | "improved" | "official" ;
    tailwindConfig?: string;
  }
];

export const tailwindSortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create(ctx) {

      const { callees } = getOptions(ctx);

      const tailwindConfig = findTailwindConfig(ctx);
      const tailwindContext = createTailwindContext(tailwindConfig);


      const lintLiterals = (ctx: Rule.RuleContext, literals: Literals, node: Node) => {

        for(const literal of literals){

          if(literal === undefined){ continue; }

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
            literal.type === "TemplateElement" && literal.closingBraces ? literal.closingBraces : "",
            ...classes,
            literal.type === "TemplateElement" && literal.openingBraces ? literal.openingBraces : "",
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
              return fixer.replaceText(literal, fixedClasses);
            },
            message: "Invalid class order: {{ notSorted }}.",
            node
          });

        }
      };


      return {

        CallExpression(node) {

          const { callee } = node;

          if(callee.type !== "Identifier"){ return; }
          if(!callees.includes(callee.name)){ return; }

          const literals = getCallExpressionLiterals(ctx, node.arguments);

          lintLiterals(ctx, literals, node);

        },

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const attributes = getClassAttributes(ctx, jsxNode);

          for(const attribute of attributes){
            const literals = getClassAttributeLiterals(ctx, attribute);
            lintLiterals(ctx, literals, node);
          }

        }

      };
    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce a consistent order for tailwind classes.",
        recommended: true
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
                type: "string"
              },
              type: "array"
            },
            classAttributes: {
              items: {
                default: getOptions().classAttributes,
                description: "The name of the attribute that contains the tailwind classes.",
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
  const officiallySortedClasses = officialClassOrder
    .sort(([, a], [, z]) => {
      if(a === z){return 0;}
      if(a === null){return -1;}
      if(z === null){return 1; }
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
