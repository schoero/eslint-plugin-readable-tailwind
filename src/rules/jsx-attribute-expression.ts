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
            const { closingQuote, openingQuote } = getAllowedQuotes(ctx, { closingQuote: literal.closingQuote, openingQuote: literal.openingQuote });

            const rawAttribute = attributeValue.type === "JSXExpressionContainer"
              ? `{${literal.raw}}`
              : literal.raw;

            const fixedAttribute = expression === "always"
              ? `{${literal.openingQuote}${literal.content}${literal.closingQuote}}`
              : `${openingQuote}${literal.content}${closingQuote}`;

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
        description: "Enforce consistent jsx attribute expressions.",
        recommended: true
      },
      fixable: "code",
      schema: [
        {
          default: getOptions().expression,
          description: "Collapse jsx class attribute expressions to a literal string if possible.",
          enum: ["always", "as-needed"],
          type: "string"
        }
      ],
      type: "layout"
    }
  }
};

function getAllowedQuotes(ctx: Rule.RuleContext, preferredQuotes: QuoteParts): QuoteParts {
  const { openingQuote } = preferredQuotes;

  if(openingQuote === "'" || openingQuote === '"'){
    return { closingQuote: openingQuote, openingQuote };
  }

  return { closingQuote: '"', openingQuote: '"' };
}

function getOptions(ctx?: Rule.RuleContext): { expression: Options[0]; } {
  const expression = ctx?.options[0] ?? "as-needed";
  return { expression };
}
