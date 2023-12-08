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
    classAttributes?: string[];
    sort?: "asc" | "desc" | "never" | false;
  }
];

export const tailwindSortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create(ctx) {

      return {

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const attributes = getClassAttributes(ctx, jsxNode);

          for(const attribute of attributes){

            const literals = getClassAttributeLiterals(ctx, attribute);

            for(const literal of literals){

              if(literal === undefined){ continue; }

              const parts = createParts(ctx, literal);
              const classChunks = splitClasses(ctx, literal.content);
              const whitespaceChunks = splitWhitespace(ctx, literal.content);

              const sortedClassChunks = sortClasses(ctx, classChunks);

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
      type: "layout"
    }
  }
};


function sortClasses(ctx: Rule.RuleContext, classes: string[], order: "asc" | "desc" = "asc"): string[] {
  return classes.toSorted((a, b) => {
    if(order === "asc"){
      return a.localeCompare(b);
    } else {
      return b.localeCompare(a);
    }
  });
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

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const sort = options.sort ?? "asc";

  return {
    classAttributes,
    sort
  };

}
