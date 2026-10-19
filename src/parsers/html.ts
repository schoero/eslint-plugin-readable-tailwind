import {
  addAttribute,
  deduplicateLiterals,
  getContent,
  getIndentation,
  getWhitespace,
  matchesName
} from "better-tailwindcss:utils/utils.js";

import type { AttributeNode, AttributeValueNode, TagNode } from "es-html-parser";
import type { Rule } from "eslint";

import type { Literal, QuoteMeta } from "better-tailwindcss:types/ast.js";
import type { AttributeSelector } from "better-tailwindcss:types/rule.js";


export function getLiteralsByHTMLAttribute(ctx: Rule.RuleContext, attribute: AttributeNode, selectors: AttributeSelector[]): Literal[] {

  const name = attribute.key.value;

  const literals = selectors.reduce<Literal[]>((literals, selector) => {
    if(!matchesName(selector.name.toLowerCase(), name.toLowerCase())){ return literals; }
    if(!selector.match){
      literals.push(...getLiteralsByHTMLAttributeNode(ctx, attribute));
      return literals;
    }

    return literals;
  }, []);

  return literals
    .filter(deduplicateLiterals)
    .map(addAttribute(name));

}

export function getAttributesByHTMLTag(ctx: Rule.RuleContext, node: TagNode): AttributeNode[] {
  return node.attributes;
}

export function getLiteralsByHTMLAttributeNode(ctx: Rule.RuleContext, attribute: AttributeNode): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  if(hasTemplateParts(value)){
    return getLiteralsByHTMLAttributeValueParts(ctx, attribute, value);
  }

  const line = ctx.sourceCode.lines[attribute.loc.start.line - 1];
  const raw = (attribute.startWrapper?.value ?? "") + value.value + (attribute.endWrapper?.value ?? "");

  const quotes = getQuotesByHTMLAttribute(attribute);
  const indentation = getIndentation(line);
  const content = getContent(raw, quotes);

  return [{
    ...quotes,
    content,
    indentation,
    isInterpolated: false,
    loc: value.loc,
    range: [
      value.range[0] - (quotes.openingQuote?.length ?? 0),
      value.range[1] + (quotes.closingQuote?.length ?? 0)
    ],
    raw,
    supportsMultiline: true,
    type: "StringLiteral"
  }];

}

function hasTemplateParts(value: AttributeValueNode): boolean {
  return value.parts?.some(part => part.type === "Template") ?? false;
}

function getLiteralsByHTMLAttributeValueParts(ctx: Rule.RuleContext, attribute: AttributeNode, value: AttributeValueNode): Literal[] {

  const attributeLine = ctx.sourceCode.lines[attribute.loc.start.line - 1];
  const literals: Literal[] = [];

  for(let index = 0; index < value.parts.length; index++){
    const part = value.parts[index];

    if(part.type === "Part"){
      literals.push(getLiteralByHTMLAttributeValuePart(
        ctx,
        attribute,
        value,
        attributeLine,
        part.range,
        part.loc,
        part.value,
        part.range[0] === value.range[0],
        part.range[1] === value.range[1]
      ));
      continue;
    }

    if(index === 0){
      const range: [number, number] = [part.range[0], part.range[0]];
      const loc = { end: part.loc.start, start: part.loc.start };

      literals.push(getLiteralByHTMLAttributeValuePart(
        ctx,
        attribute,
        value,
        attributeLine,
        range,
        loc,
        "",
        true,
        false,
        undefined,
        part.open?.value
      ));
    }

    if(index === value.parts.length - 1){
      const range: [number, number] = [part.range[1], part.range[1]];
      const loc = { end: part.loc.end, start: part.loc.end };

      literals.push(getLiteralByHTMLAttributeValuePart(
        ctx,
        attribute,
        value,
        attributeLine,
        range,
        loc,
        "",
        false,
        true,
        part.close?.value
      ));
    }
  }

  return literals;

}

function getLiteralByHTMLAttributeValuePart(
  ctx: Rule.RuleContext,
  attribute: AttributeNode,
  value: AttributeValueNode,
  attributeLine: string,
  partRange: [number, number],
  partLoc: AttributeValueNode["parts"][number]["loc"],
  partValue: string,
  isFirstPart: boolean,
  isLastPart: boolean,
  closingBraces?: string,
  openingBraces?: string
): Literal {

  const quotes = getQuotesByHTMLAttributePart(attribute, isFirstPart, isLastPart);
  const braces = getBracesByHTMLAttributePart(value, partRange);
  if(closingBraces !== undefined){
    braces.closingBraces = closingBraces;
  }
  if(openingBraces !== undefined){
    braces.openingBraces = openingBraces;
  }
  const isInterpolated = braces.closingBraces !== undefined || braces.openingBraces !== undefined;

  const line = isInterpolated ? attributeLine : ctx.sourceCode.lines[partLoc.start.line - 1];
  const indentation = getIndentation(line);

  const range: [number, number] = [
    isFirstPart ? value.range[0] - (quotes.openingQuote?.length ?? 0) : partRange[0] - (braces.closingBraces?.length ?? 0),
    isLastPart ? value.range[1] + (quotes.closingQuote?.length ?? 0) : partRange[1] + (braces.openingBraces?.length ?? 0)
  ];

  const raw = [
    quotes.openingQuote ?? "",
    braces.closingBraces ?? "",
    partValue,
    braces.openingBraces ?? "",
    quotes.closingQuote ?? ""
  ].join("");

  const content = getContent(raw, quotes, braces);
  const whitespaces = getWhitespace(content);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    content,
    indentation,
    isInterpolated,
    loc: partLoc,
    range,
    raw,
    supportsMultiline: true,
    type: "StringLiteral"
  } satisfies Literal;

}

function getBracesByHTMLAttributePart(value: AttributeValueNode, range: [number, number]): { closingBraces?: string | undefined; openingBraces?: string | undefined; } {
  const index = value.parts.findIndex(part => part.range[0] === range[0] && part.range[1] === range[1]);

  const previousPart = value.parts[index - 1];
  const nextPart = value.parts[index + 1];

  return {
    closingBraces: previousPart?.type === "Template" ? previousPart.close?.value : undefined,
    openingBraces: nextPart?.type === "Template" ? nextPart.open?.value : undefined
  };
}

function getQuotesByHTMLAttribute(attribute: AttributeNode): QuoteMeta {
  const openingQuote = attribute.startWrapper?.value;
  const closingQuote = attribute.endWrapper?.value;

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' ? openingQuote : undefined
  };
}

function getQuotesByHTMLAttributePart(attribute: AttributeNode, isFirstPart: boolean, isLastPart: boolean): QuoteMeta {
  const quotes = getQuotesByHTMLAttribute(attribute);

  return {
    closingQuote: isLastPart ? quotes.closingQuote : undefined,
    openingQuote: isFirstPart ? quotes.openingQuote : undefined
  };
}
