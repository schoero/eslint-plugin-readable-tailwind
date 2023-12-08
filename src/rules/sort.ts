import { getClassAttributeLiterals, getClassAttributes } from "eptm:utils:jsx.js";
import { combineClasses, splitClasses } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";


export default {
  create(ctx) {

    return {

      JSXOpeningElement(node: Node) {

        const jsxNode = node as JSXOpeningElement;

        const attributes = getClassAttributes(ctx, jsxNode);

        for(const attribute of attributes){

          const literals = getClassAttributeLiterals(ctx, attribute);

          for(const literal of literals){

            if(literal === undefined){ continue; }

            const classes = splitClasses(ctx, literal.content);
            const sortedClasses = sortClasses(ctx, classes);
            const combinedClasses = combineClasses(ctx, sortedClasses, literal);

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
} satisfies Rule.RuleModule;


function sortClasses(ctx: Rule.RuleContext, classes: string[]): string[] {
  // const classChunks = classes.map(className => unwrapClass(ctx, className));
  return classes.toSorted();
}
