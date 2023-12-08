import { getClassAttributeLiterals, isJSXAttribute } from "eptm:utils:jsx.js";
import { combineClasses, splitClasses } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXAttribute, JSXOpeningElement } from "estree-jsx";
import type { ReadableTailwindOptions } from "src/types/rule.js";


export const name = "readable-tailwind" as const;

export const rule = {
  create(ctx) {

    return {

      JSXOpeningElement(node: Node) {

        const jsxNode = node as JSXOpeningElement;

        const attributes = getClassAttributes(ctx, jsxNode);

        const options = getOptions(ctx);

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


export function getClassAttributes(ctx: Rule.RuleContext, node: JSXOpeningElement): JSXAttribute[] {

  const { classAttributes } = getOptions(ctx);

  return node.attributes.reduce<JSXAttribute[]>((acc, attribute) => {
    if(isJSXAttribute(attribute) && classAttributes.includes(attribute.name.name)){
      acc.push(attribute);
    }
    return acc;
  }, []);

}

function getOptions(ctx: Rule.RuleContext): ReadableTailwindOptions {

  const options = ctx.options[0] ?? {};

  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? 5;
  const classAttributes = options.classAttributes ?? ["class", "className"];
  const sortByModifiers = options.sort ?? true;
  const sortByPseudoElements = options.sortByPseudoElements ?? true;

  return {
    classAttributes,
    classesPerLine,
    printWidth
  };

}
