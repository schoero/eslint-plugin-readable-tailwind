import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "eptm:utils:config.js";
import { getCallExpressionLiterals, getClassAttributeLiterals, getClassAttributes } from "eptm:utils:jsx.js";
import { combineClasses, createParts, splitClasses } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { ESLintRule } from "src/types/rule.js";

import type { StringLiteral, TemplateLiteralString } from "eptm:utils:jsx.js";


export type Options = [
  {
    callees?: string[];
    classAttributes?: string[];
    classesPerLine?: number;
    group?: "emptyLine" | "never" | "newLine";
    indent?: number | "tab";
    printWidth?: number;
    trim?: boolean;
  }
];

export const tailwindMultiline: ESLintRule<Options> = {
  name: "multiline" as const,
  rule: {
    create(ctx) {

      const { callees, classesPerLine, indent: indentation, printWidth } = getOptions(ctx);

      const splitLines = (ctx: Rule.RuleContext, literal: StringLiteral | TemplateLiteralString, startPosition: number) => {

        const lines: string[][] = [];

        const classChunks = splitClasses(literal.content);
        const groupedClasses = groupClasses(ctx, classChunks);

        for(let i = 0, l = 0; i < groupedClasses.length; i++){

          if(groupedClasses[i] === ""){
            l++;
            lines[l] = [groupedClasses[i]];
            continue;
          }

          const newClasses = [...lines[l] ?? [], groupedClasses[i]];
          const newLine = combineClasses(newClasses, {});

          if(newClasses.length > classesPerLine || newLine.length > printWidth){
            l++;
            lines[l] = [indent(ctx, startPosition) + groupedClasses[i]];
            continue;
          }

          if(l === 0 && i === 0){
            lines[l] = [indent(ctx, startPosition) + groupedClasses[i]];
          } else if(lines[l].length === 1 && lines[l][0] === ""){
            lines[l] = [indent(ctx, startPosition) + groupedClasses[i]];
          } else {
            lines[l].push(groupedClasses[i]);
          }

        }

        return [
          "",
          ...lines.map(line => line.join(" ")),
          indent(ctx, startPosition - getIndentation(ctx, indentation))
        ];

      };


      return {

        CallExpression(node) {

          const { callee } = node;

          if(callee.type !== "Identifier"){ return; }
          if(!callees.includes(callee.name)){ return; }

          const startPosition = (callee.loc?.start.column ?? 0) + getIndentation(ctx, indentation);

          const literals = getCallExpressionLiterals(ctx, node.arguments);

          for(const literal of literals){
            if(literal === undefined){ continue; }

            const lines = splitLines(ctx, literal, startPosition);

            if(lines.length === 3){ continue; }

            const joinedLines = lines.join("\n");

            if(literal.type === "Literal"){

              const { leadingQuote, trailingQuote, ...parts } = createParts(literal);
              const combinedClasses = combineClasses([joinedLines], parts);

              ctx.report({
                data: {
                  rawLiteral: literal.raw
                },
                fix(fixer) {
                  return fixer.replaceText(literal, `{\`${combinedClasses}\`}`);
                },
                message: "Invalid literal string: {{ rawLiteral }}.",
                node
              });
            }

            const parts = createParts(literal);
            const combinedClasses = combineClasses([joinedLines], parts);

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

        },

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const attributes = getClassAttributes(ctx, jsxNode);

          for(const attribute of attributes){

            const attributeValue = attribute.value;
            const attributeName = attribute.name.name;

            if(!attributeValue){ continue; }
            if(typeof attributeName !== "string"){ continue; }

            const startPosition = (attribute.loc?.start.column ?? 0) + getIndentation(ctx, indentation);

            const literals = getClassAttributeLiterals(ctx, attribute);


            for(const literal of literals){

              if(literal === undefined){ continue; }

              const lines = splitLines(ctx, literal, startPosition);

              if(lines.length === 3){ continue; }

              const joinedLines = lines.join("\n");

              if(attributeValue.type === "Literal"){

                const { leadingQuote, trailingQuote, ...parts } = createParts(literal);
                const combinedClasses = combineClasses([joinedLines], parts);

                ctx.report({
                  data: {
                    attributeName,
                    rawAttribute: attributeValue.raw ?? ""
                  },
                  fix(fixer) {
                    return fixer.replaceText(attributeValue, `{\`${combinedClasses}\`}`);
                  },
                  message: "Invalid jsx attribute quotes: {{ attributeName }}={{ rawAttribute }}.",
                  node
                });
              }

              const parts = createParts(literal);
              const combinedClasses = combineClasses([joinedLines], parts);

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
        description: "Enforce consistent line wrapping for tailwind classes.",
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
              default: getOptions().group,
              description: "The group separator.",
              enum: ["emptyLine", "never", "newLine"],
              type: "string"
            },
            indent: {
              default: getOptions().indent,
              description: "Determines how the code should be indented.",
              oneOf: [
                {
                  enum: ["tab"],
                  type: "string"
                },
                {
                  minimum: 0,
                  type: "integer"
                }
              ],
              type: "integer"

            },
            printWidth: {
              default: getOptions().printWidth,
              description: "The maximum line length. Lines are wrapped appropriately to stay within this limit or within the limit provided by the classesPerLine option."
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};

function groupClasses(ctx: Rule.RuleContext, classChunks: string[]) {

  const { group } = getOptions(ctx);

  if(group === "never"){
    return classChunks;
  }

  return classChunks.reduce<string[]>((acc, chunk) => {

    if(acc.length === 0){
      acc.push(chunk);
      return acc;
    }

    const lastChunk = acc[acc.length - 1];
    const lastModifier = lastChunk.match(/^.*?:/)?.[0];
    const modifier = chunk.match(/^.*?:/)?.[0];

    if(lastModifier !== modifier){
      if(group === "emptyLine"){
        acc.push("", "");
      } else {
        acc.push("");
      }
    }

    acc.push(chunk);

    return acc;

  }, []);

}

function indent(ctx: Rule.RuleContext, start: number): string {
  const indent = getOptions(ctx).indent;

  if(indent === "tab"){
    return "\t".repeat(start);
  } else {
    return " ".repeat(start);
  }
}

function getIndentation(ctx: Rule.RuleContext, indentation: Options[0]["indent"]): number {
  return indentation === "tab" ? 1 : indentation ?? 0;
}

function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? 100_000;
  const indent = options.indent ?? 4;
  const group = options.group ?? "emptyLine";

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;

  return {
    callees,
    classAttributes,
    classesPerLine,
    group,
    indent,
    printWidth
  };

}
