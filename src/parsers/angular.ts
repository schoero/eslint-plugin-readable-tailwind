import { isAttributesMatchers, isAttributesName, isAttributesRegex } from "readable-tailwind:utils:matchers.js";
import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { ParseSourceSpan, TmplAstElement, TmplAstTextAttribute } from "@angular/compiler";
import type { Rule } from "eslint";
import type { SourceLocation } from "estree";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { Attributes } from "readable-tailwind:types:rule.js";


export function getAttributesByAngularElement(ctx: Rule.RuleContext, node: TmplAstElement) {
  return node.attributes;
}

export function getLiteralsByAngularAttribute(ctx: Rule.RuleContext, attribute: TmplAstTextAttribute, attributes: Attributes): Literal[] {
  const literals = attributes.reduce<Literal[]>((literals, attributes) => {
    if(isAttributesName(attributes)){
      if(attributes.toLowerCase() !== attribute.name.toLowerCase()){ return literals; }
      literals.push(...getLiteralsByAngularAttributeNode(ctx, attribute));
    } else if(isAttributesRegex(attributes)){
      // console.warn("Regex not supported for now");
    } else if(isAttributesMatchers(attributes)){
      // console.warn("Matchers not supported for now");
    }

    return literals;
  }, []);
  return deduplicateLiterals(literals);
}

export function getLiteralsByAngularAttributeNode(ctx: Rule.RuleContext, attribute: TmplAstTextAttribute): Literal[] {
  const content = attribute.value;

  if(!attribute.valueSpan){
    return [];
  }

  const start = attribute.valueSpan.fullStart;
  const end = attribute.valueSpan.end;
  const range = [start.offset - 1, end.offset + 1] satisfies [number, number];
  const raw = attribute.sourceSpan.start.file.content.slice(...range);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const loc = convertNodeSourceSpanToLoc(attribute.valueSpan);

  return [{
    ...quotes,
    ...whitespaces,
    content,
    loc,
    // @ts-expect-error - Missing in types
    node: attribute,
    // @ts-expect-error - Missing in types
    parent: attribute.parent,
    range,
    raw,
    type: "StringLiteral"
  }];
}

function convertNodeSourceSpanToLoc(
  sourceSpan: ParseSourceSpan
): SourceLocation {
  return {
    end: {
      column: sourceSpan.end.col,
      line: sourceSpan.end.line + 1
    },
    start: {
      column: sourceSpan.fullStart.col,
      line: sourceSpan.fullStart.line + 1
    }
  };
}
