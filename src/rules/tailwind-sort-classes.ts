import { resolve } from "node:path";

import defaultConfig from "tailwindcss/defaultConfig.js";
import setupContextUtils from "tailwindcss/lib/lib/setupContextUtils.js";
import loadConfig from "tailwindcss/loadConfig.js";
import resolveConfig from "tailwindcss/resolveConfig.js";

import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "eptm:utils:config.js";
import { getCallExpressionLiterals, getClassAttributeLiterals, isJSXAttribute } from "eptm:utils:jsx.js";
import { combineClasses, splitClasses, splitWhitespace } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXAttribute, JSXOpeningElement } from "estree-jsx";
import type { Parts } from "src/types/ast.js";
import type { ESLintRule } from "src/types/rule.js";
import type { Config } from "tailwindcss/types/config.js";

import type { Literals } from "eptm:utils:jsx.js";


export type Options = [
  {
    callees?: string[];
    classAttributes?: string[];
    order?: "asc" | "desc" | "official" ;
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

          const parts = createParts(ctx, literal);
          const classChunks = splitClasses(ctx, literal.content);
          const whitespaceChunks = splitWhitespace(ctx, literal.content);

          const sortedClassChunks = sortClasses(ctx, tailwindContext, classChunks);

          const classes: string[] = [];

          for(let i = 0; i < Math.max(sortedClassChunks.length, whitespaceChunks.length); i++){
            whitespaceChunks[i] && classes.push(whitespaceChunks[i]);
            sortedClassChunks[i] && classes.push(sortedClassChunks[i]);
          }

          const combinedClasses = combineClasses(ctx, classes, parts);

          if(literal.raw === combinedClasses){
            return;
          }

          ctx.report({
            data: {
              notSorted: literal.content
            },
            fix(fixer) {
              return fixer.replaceText(literal, combinedClasses);
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
              items: {
                type: "string"
              },
              type: "array"
            },
            classAttributes: {
              items: {
                type: "string"
              },
              type: "array"
            },
            order: {
              enum: [
                "asc",
                "desc",
                "official"
              ],
              type: "string"
            },
            tailwindConfig: {
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

  if(order === "official"){

    const sortedClasses = tailwindContext.getClassOrder(classes) as [string, bigint | null][];

    return sortedClasses
      .sort(([, a], [, z]) => {
        if(a === z){return 0;}
        if(a === null){return -1;}
        if(z === null){return 1; }
        return +(a - z > 0n) - +(a - z < 0n);
      })
      .map(([className]) => className);
  }

  return [...classes].sort((a, b) => {
    if(order === "asc"){
      return a.localeCompare(b);
    } else {
      return b.localeCompare(a);
    }
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

export function getClassAttributes(ctx: Rule.RuleContext, node: JSXOpeningElement): JSXAttribute[] {

  const { classAttributes } = getOptions(ctx);

  return node.attributes.reduce<JSXAttribute[]>((acc, attribute) => {
    if(isJSXAttribute(attribute) && classAttributes.includes(attribute.name.name as string)){
      acc.push(attribute);
    }
    return acc;
  }, []);

}

function createParts(ctx: Rule.RuleContext, literal: Parts): Parts {

  const parts: Parts = {};

  // parts.leadingWhitespace = literal.leadingWhitespace;
  // parts.trailingWhitespace = literal.trailingWhitespace;

  if("leadingQuote" in literal){
    parts.leadingQuote = literal.leadingQuote;
    parts.trailingQuote = literal.trailingQuote;
  }

  if("leadingBraces" in literal){
    parts.leadingBraces = literal.leadingBraces;
    parts.trailingBraces = literal.trailingBraces;
  }

  return parts;

}

function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const order = options.order ?? "official";
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
