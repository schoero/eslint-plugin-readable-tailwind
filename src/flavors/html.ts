import type { AttributeNode, TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { Literal, QuoteMeta } from "src/types/ast.js";


export function getHTMLAttributes(ctx: Rule.RuleContext, classAttributes: string[], node: TagNode): AttributeNode[] {
  return node.attributes.reduce<AttributeNode[]>((acc, attribute) => {
    if(classAttributes.includes(attribute.key.value)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}


export function getHTMLClassAttributeLiterals(ctx: Rule.RuleContext, attribute: AttributeNode): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  const raw = attribute.startWrapper?.value + value.value + attribute.endWrapper?.value;
  const { closingQuote, openingQuote } = getAttributeValueQuotes(ctx, attribute);

  return [{
    closingQuote,
    content: value.value,
    loc: value.loc,
    openingQuote,
    // @ts-expect-error - Missing in types
    parent: attribute.parent,
    range: [value.range[0] - 1, value.range[1] + 1], // include quotes in range
    raw,
    type: "StringLiteral"
  }];

}


function getAttributeValueQuotes(ctx: Rule.RuleContext, attribute: AttributeNode): QuoteMeta {
  const openingQuote = attribute.startWrapper?.value;
  const closingQuote = attribute.endWrapper?.value;

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' ? openingQuote : undefined
  };
}
