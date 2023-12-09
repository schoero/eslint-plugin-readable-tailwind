import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "eptm:utils:config.js";
import { getCallExpressionLiterals, getClassAttributeLiterals, getClassAttributes } from "eptm:utils:jsx.js";
import { combineClasses, createParts, indent, splitClasses } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { ESLintRule } from "src/types/rule.js";

import type { Literals } from "eptm:utils:jsx.js";


export type Options = [
  {
    callees?: string[];
    classAttributes?: string[];
    classesPerLine?: number;
    group?: "emptyLine" | "never" | "newLine";
    printWidth?: number;
    tabWidth?: number;
    trim?: boolean;
  }
];

export const tailwindMultiline: ESLintRule<Options> = {
  name: "multiline" as const,
  rule: {
    create(ctx) {

      const { callees, classesPerLine, printWidth, tabWidth } = getOptions(ctx);

      const splitLiterals = (ctx: Rule.RuleContext, literals: Literals, startPosition: number) => {

        return literals.map(literal => {

          if(literal === undefined){ return; }

          const lines: string[][] = [];

          const classChunks = splitClasses(literal.content);

          for(let i = 0, l = 0; i < classChunks.length; i++){
            const newClasses = [...lines[l] ?? [], classChunks[i]];
            const newLine = combineClasses(newClasses, {});

            if(newClasses.length > classesPerLine || newLine.length > printWidth){
              l++;
              lines[l] = [indent(startPosition) + classChunks[i]];
              continue;
            }

            if(l === 0 && i === 0){
              lines[l] = [indent(startPosition) + classChunks[i]];
            } else {
              lines[l].push(classChunks[i]);
            }

          }

          return lines.join("\n");

        });
      };


      return {

        CallExpression(node) {

          const { callee } = node;

          if(callee.type !== "Identifier"){ return; }
          if(!callees.includes(callee.name)){ return; }

          const startPosition = (callee.loc?.start.column ?? 0) + tabWidth;

          const literals = getCallExpressionLiterals(ctx, node.arguments);

          splitLiterals(ctx, literals, startPosition);

        },

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const attributes = getClassAttributes(ctx, jsxNode);

          for(const attribute of attributes){

            const attributeValue = attribute.value;
            const attributeName = attribute.name.name;

            if(!attributeValue){ continue; }
            if(typeof attributeName !== "string"){ continue; }

            const startPosition = (attribute.loc?.start.column ?? 0) + tabWidth;

            const literals = getClassAttributeLiterals(ctx, attribute);
            const literalsWithLines = splitLiterals(ctx, literals, startPosition);

            for(let i = 0; i < literalsWithLines.length; i++){

              const literal = literals[i];
              const lines = literalsWithLines[i];

              if(literal === undefined){ continue; }
              if(lines === undefined){ continue; }

              const parts = createParts(literal);
              const combinedClasses = combineClasses([lines], parts);

              if(attributeValue.type === "Literal"){
                ctx.report({
                  data: {
                    attributeName,
                    rawAttribute: attributeValue.raw ?? ""
                  },
                  fix(fixer) {
                    return fixer.replaceText(attributeValue, `{${combinedClasses}}`);
                  },
                  message: "Invalid jsx attribute expression: {{ attributeName }}={{ rawAttribute }}.",
                  node
                });
              }

              if(literal.raw === combinedClasses){
                return;
              }

              ctx.report({
                data: {
                  notReadable: literal.content
                },
                fix(fixer) {
                  return fixer.replaceText(literal, combinedClasses);
                },
                message: "Invalid line wrapping: {{ notReadable }}.",
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
            classesPerLine: {
              default: getOptions().classesPerLine,
              description: "The maximum number of classes per line.",
              type: "integer"
            },
            group: {
              default: "emptyLine",
              description: "The group separator.",
              enum: ["emptyLine", "never", "newLine"],
              type: "string"
            },
            printWidth: {
              default: getOptions().printWidth,
              description: "The maximum line length. Lines are wrapped appropriately to stay within this limit or within the limit provided by the classesPerLine option.",
              type: "integer"
            },
            tabWidth: {
              default: getOptions().tabWidth,
              description: "The number of spaces per indentation-level.",
              type: "integer"
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};


function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? Infinity;
  const tabWidth = options.tabWidth ?? 4;

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;

  return {
    callees,
    classAttributes,
    classesPerLine,
    printWidth,
    tabWidth
  };

}
