import { getClassAttributeLiterals, isJSXAttribute } from "eptm:utils:jsx.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { QuoteParts } from "src/types/ast.js";
import type { ESLintRule } from "src/types/rule.js";


type Options = ["always" | "as-needed"];

export const jsxAttributeExpression: ESLintRule<Options> = {
  name: "jsx-attribute-expression" as const,
  rule: {
    create(ctx) {

      return {

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          for(const attribute of jsxNode.attributes){

            if(!isJSXAttribute(attribute)){ continue; }

            const literals = getClassAttributeLiterals(ctx, attribute);

            if(literals.length !== 1){ continue; }

            const literal = literals[0]!;

            const attributeValue = attribute.value;
            const attributeName = attribute.name.name;

            if(!attributeValue){ continue; }
            if(typeof attributeName !== "string"){ continue; }
            if(literal.content.includes("\n")){ continue; }

            const { expression } = getOptions(ctx);
            const { leadingQuote, trailingQuote } = getAllowedQuotes(ctx, { leadingQuote: literal.leadingQuote, trailingQuote: literal.trailingQuote });

            const rawAttribute = attributeValue.type === "JSXExpressionContainer"
              ? `{${literal.raw}}`
              : literal.raw;

            const fixedAttribute = expression === "always"
              ? `{${literal.leadingQuote}${literal.content}${literal.trailingQuote}}`
              : `${leadingQuote}${literal.content}${trailingQuote}`;

            if(rawAttribute === fixedAttribute){
              return;
            }

            ctx.report({
              data: {
                attributeName,
                rawAttribute
              },
              fix(fixer) {
                return fixer.replaceText(attributeValue, fixedAttribute);
              },
              message: "Invalid jsx attribute expression: {{ attributeName }}={{ rawAttribute }}.",
              node
            });

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

function getAllowedQuotes(ctx: Rule.RuleContext, preferredQuotes: QuoteParts): QuoteParts {
  const { leadingQuote, trailingQuote } = preferredQuotes;

  if(leadingQuote === "'" || leadingQuote === '"'){
    return { leadingQuote, trailingQuote: leadingQuote };
  }

  return { leadingQuote: '"', trailingQuote: '"' };
}

function getOptions(ctx: Rule.RuleContext): { expression: Options[0]; } {
  const expression = ctx.options[0] ?? "as-needed";
  return { expression };
}
