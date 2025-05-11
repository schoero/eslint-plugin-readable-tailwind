import { isAttributesMatchers, isAttributesName, isAttributesRegex } from "better-tailwindcss:utils:matchers.js";
import { deduplicateLiterals, getContent, getIndentation, matchesName } from "better-tailwindcss:utils:utils.js";

import type { AttributeNode, TagNode } from "es-html-parser";
import type { Rule } from "eslint";

import type { Literal, QuoteMeta } from "better-tailwindcss:types:ast.js";
import type { Attributes } from "better-tailwindcss:types:rule.js";


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

  const line = ctx.sourceCode.lines[attribute.loc.start.line - 1];
  const raw = attribute.startWrapper?.value + value.value + attribute.endWrapper?.value;


  const quotes = getQuotesByHTMLAttribute(ctx, attribute);
  const indentation = getIndentation(line);
  const content = getContent(raw, quotes);

  return [{
    ...quotes,
    content,
    indentation,
    loc: value.loc,
    range: [value.range[0] - 1, value.range[1] + 1], // include quotes in range
    raw,
    supportsMultiline: true,
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
