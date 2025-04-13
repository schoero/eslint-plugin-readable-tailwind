import { isAttributesMatchers, isAttributesName, isAttributesRegex } from "readable-tailwind:utils:matchers.js";
import { deduplicateLiterals, getContent, matchesName } from "readable-tailwind:utils:utils.js";

import type { AttributeNode, TagNode } from "es-html-parser";
import type { Rule } from "eslint";

import type { Literal, QuoteMeta } from "readable-tailwind:types:ast.js";
import type { Attributes } from "readable-tailwind:types:rule.js";


export function getLiteralsByHTMLAttribute(ctx: Rule.RuleContext, attribute: AttributeNode, attributes: Attributes): Literal[] {
  const literals = attributes.reduce<Literal[]>((literals, attributes) => {
    if(isAttributesName(attributes)){
      if(!matchesName(attributes.toLowerCase(), attribute.key.value.toLowerCase())){ return literals; }
      literals.push(...getLiteralsByHTMLAttributeNode(ctx, attribute));
    } else if(isAttributesRegex(attributes)){
      // console.warn("Regex not supported in HTML");
    } else if(isAttributesMatchers(attributes)){
      // console.warn("Matchers not supported in HTML");
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

export function getAttributesByHTMLTag(ctx: Rule.RuleContext, node: TagNode): AttributeNode[] {
  return node.attributes;
}

export function getLiteralsByHTMLAttributeNode(ctx: Rule.RuleContext, attribute: AttributeNode): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  const raw = attribute.startWrapper?.value + value.value + attribute.endWrapper?.value;

  const quotes = getQuotesByHTMLAttribute(ctx, attribute);
  const content = getContent(raw, quotes);

  return [{
    ...quotes,
    content,
    loc: value.loc,
    // @ts-expect-error - Missing in types
    node: attribute,
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
