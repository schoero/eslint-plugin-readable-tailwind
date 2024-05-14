import type { AttributeNode, TagNode } from "es-html-parser";
import type { Rule } from "eslint";

import type { Literal, QuoteMeta } from "readable-tailwind:types:ast.js";


export function getAttributesByHTMLTag(ctx: Rule.RuleContext, node: TagNode): AttributeNode[] {
  return node.attributes;
}


export function getLiteralsByHTMLClassAttribute(ctx: Rule.RuleContext, attribute: AttributeNode): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  const raw = attribute.startWrapper?.value + value.value + attribute.endWrapper?.value;
  const { closingQuote, openingQuote } = getQuotesByHTMLAttribute(ctx, attribute);

  return [{
    closingQuote,
    content: value.value,
    loc: value.loc,
    // @ts-expect-error - Missing in types
    node: attribute,
    openingQuote,
    // @ts-expect-error - Missing in types
    parent: attribute.parent,
    range: [value.range[0] - 1, value.range[1] + 1], // include quotes in range
    raw,
    type: "StringLiteral"
  }];

}


function getQuotesByHTMLAttribute(ctx: Rule.RuleContext, attribute: AttributeNode): QuoteMeta {
  const openingQuote = attribute.startWrapper?.value;
  const closingQuote = attribute.endWrapper?.value;

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' ? openingQuote : undefined
  };
}
