import { getClassAttributeLiterals, isJSXAttribute } from "eptm:utils:jsx.js";
import { combineClasses, splitClasses } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXAttribute, JSXOpeningElement } from "estree-jsx";
import type { Parts } from "src/types/ast.js";
import type { ESLintRule } from "src/types/rule.js";


export type Options = [
  {
    classAttributes?: string[];
    classesPerLine?: number;
    group?: "emptyLine" | "never" | "newLine" | false;
    printWidth?: number;
    sort?: "asc" | "desc" | "never" | false;
    trim?: boolean;
  }
];

export const readableTailwind: ESLintRule<Options> = {
  name: "readable-tailwind" as const,
  rule: {
    create(ctx) {

      return {

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const options = getOptions(ctx);
          const attributes = getClassAttributes(ctx, jsxNode);

          for(const attribute of attributes){

            const literals = getClassAttributeLiterals(ctx, attribute);

            for(const literal of literals){

              if(literal === undefined){ continue; }

              const parts = createParts(ctx, literal);
              const classes = splitClasses(ctx, literal.content);
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
          }
        }

      };
    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Auto-wrap Tailwind CSS classes based on specified width and formatting rules",
        recommended: true
      },
      fixable: "code",
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

  const options = getOptions(ctx);

  const parts: Parts = {};

  if(!options.trim){
    parts.leadingWhitespace = literal.leadingWhitespace;
    parts.trailingWhitespace = literal.trailingWhitespace;
  }

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

  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? Infinity;
  const classAttributes = options.classAttributes ?? ["class", "className"];
  const sort = options.sort ?? "asc";
  const group = options.group ?? true;
  const trim = options.trim ?? true;

  return {
    classAttributes,
    classesPerLine,
    group,
    printWidth,
    sort,
    trim
  };

}
