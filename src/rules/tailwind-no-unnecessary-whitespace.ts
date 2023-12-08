import { DEFAULT_CLASS_NAMES } from "eptm:utils:config.js";
import { getClassAttributeLiterals, isJSXAttribute } from "eptm:utils:jsx.js";
import { combineClasses, splitClasses, splitWhitespace } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXAttribute, JSXOpeningElement } from "estree-jsx";
import type { Parts } from "src/types/ast.js";
import type { ESLintRule } from "src/types/rule.js";


export type Options = [
  {
    allowMultiline?: boolean;
    classAttributes?: string[];
  }
];

export const tailwindNoUnnecessaryWhitespace: ESLintRule<Options> = {
  name: "no-unnecessary-whitespace" as const,
  rule: {
    create(ctx) {

      return {

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const attributes = getClassAttributes(ctx, jsxNode);

          const { allowMultiline } = getOptions(ctx);

          for(const attribute of attributes){

            const literals = getClassAttributeLiterals(ctx, attribute);

            for(const literal of literals){

              if(literal === undefined){ continue; }

              const parts = createParts(ctx, literal);
              const classChunks = splitClasses(ctx, literal.content);
              const whitespaceChunks = splitWhitespace(ctx, literal.content);

              const classes: string[] = [];

              if(allowMultiline){
                for(let i = 0; i < Math.max(classChunks.length, whitespaceChunks.length); i++){
                  if(whitespaceChunks[i] && whitespaceChunks[i].includes("\n")){
                    classes.push(whitespaceChunks[i]);
                    classChunks[i] && classes.push(classChunks[i]);
                  } else {
                    if(classChunks[i] && i > 0){ classes.push(" "); }
                    classChunks[i] && classes.push(classChunks[i]);
                  }
                }
              } else {
                for(let i = 0; i < classChunks.length; i++){
                  if(i > 0){ classes.push(" "); }
                  classes.push(classChunks[i]);
                }
              }

              const combinedClasses = combineClasses(ctx, classes, parts);

              if(literal.raw === combinedClasses){
                return;
              }

              ctx.report({
                data: {
                  unnecessaryWhitespace: literal.content
                },
                fix(fixer) {
                  return fixer.replaceText(literal, combinedClasses);
                },
                message: "Unnecessary whitespace: {{ unnecessaryWhitespace }}.",
                node
              });

            }
          }
        }

      };
    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Disallow unnecessary whitespace in tailwind classes.",
        recommended: true
      },
      fixable: "whitespace",
      schema: [
        {
          additionalProperties: false,
          properties: {
            allowMultiline: {
              type: "boolean"
            },
            classAttributes: {
              items: {
                type: "string"
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

  if("leadingQuote" in literal){
    parts.leadingQuote = literal.leadingQuote;
    parts.trailingQuote = literal.trailingQuote;
  }

  if("leadingBraces" in literal){
    parts.leadingBraces = literal.leadingBraces;
    parts.trailingBraces = literal.trailingBraces;
    if(literal.leadingBraces){ parts.leadingWhitespace = literal.leadingWhitespace; }
    if(literal.trailingBraces){ parts.trailingWhitespace = literal.trailingWhitespace; }
  }

  return parts;

}

function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const allowMultiline = options.allowMultiline ?? true;

  return {
    allowMultiline,
    classAttributes
  };

}
