import { isAttributesMatchers, isAttributesName, isAttributesRegex } from "readable-tailwind:utils:matchers.js";
import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { TmplAstElement, TmplAstTextAttribute } from "@angular/compiler";
import type { Rule } from "eslint";

import type { Literal, Loc } from "readable-tailwind:types:ast.js";
import type { Attributes } from "readable-tailwind:types:rule.js";


export type AngularAttributeWithLoc = Loc & TmplAstTextAttribute;

export function getAttributesByAngularElement(ctx: Rule.RuleContext, node: TmplAstElement) {
  return node.attributes;
}
export function getLiteralsByAngularAttributes(ctx: Rule.RuleContext, attribute: AngularAttributeWithLoc, attributes: Attributes): Literal[] {
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

export function getLiteralsByAngularAttributeNode(ctx: Rule.RuleContext, attribute: AngularAttributeWithLoc): Literal[] {
  const content = attribute.value;

  if(!content){
    return [];
  }
  const start = attribute.keySpan!.end;
  const end = attribute.valueSpan!.end;
  const raw = attribute.sourceSpan.start.file.content.slice(start.offset + 1, end.offset + 1);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return [{
    ...quotes,
    ...whitespaces,
    content,
    loc: attribute.loc,
    // @ts-expect-error - Missing in types
    node: attribute,
    // @ts-expect-error - Missing in types
    parent: attribute.parent,
    range: [start.offset + 1, end.offset + 1], // include quotes in range
    raw,
    type: "StringLiteral"
  }];
}
