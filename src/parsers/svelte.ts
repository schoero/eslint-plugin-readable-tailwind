import {
  getLiteralByESTemplateElement,
  getStringLiteralByESStringLiteral,
  hasESNodeParentExtension,
  isESNode,
  isESSimpleStringLiteral
} from "readable-tailwind:parsers:es.js";
import { getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode, Node as ESNode, TemplateLiteral as ESTemplateLiteral } from "estree";
import type {
  SvelteAttribute,
  SvelteDirective,
  SvelteGenericsDirective,
  SvelteLiteral,
  SvelteMustacheTagText,
  SvelteShorthandAttribute,
  SvelteSpecialDirective,
  SvelteSpreadAttribute,
  SvelteStartTag,
  SvelteStyleDirective
} from "svelte-eslint-parser/lib/ast/index.js";

import type { ESSimpleStringLiteral } from "readable-tailwind:parsers:es.js";
import type { Literal, Node, StringLiteral, TemplateLiteral } from "readable-tailwind:types:ast.js";


export function getAttributesBySvelteTag(ctx: Rule.RuleContext, classAttributes: string[], node: SvelteStartTag): SvelteAttribute[] {
  return node.attributes.reduce<SvelteAttribute[]>((acc, attribute) => {
    if(isSvelteAttribute(attribute) && classAttributes.includes(attribute.key.name)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}

export function getLiteralsBySvelteClassAttribute(ctx: Rule.RuleContext, attribute: SvelteAttribute): Literal[] {

  const value = attribute.value[0];

  // eslint-disable-next-line eslint-plugin-typescript/no-unnecessary-condition
  if(!value){ // empty attribute
    return [];
  }

  if(isSvelteStringLiteral(value)){
    const stringLiteral = getStringLiteralBySvelteStringLiteral(ctx, value);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isSvelteMustacheTagWithESTemplateLiteral(value)){
    return getLiteralsBySvelteMustacheTag(ctx, value.expression);
  }

  if(isSvelteMustacheTagWithESSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByESStringLiteral(ctx, value.expression);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  return [];

}

function getStringLiteralBySvelteStringLiteral(ctx: Rule.RuleContext, node: SvelteLiteral): StringLiteral | undefined {

  const content = node.value;
  const raw = ctx.sourceCode.getText(node as unknown as ESNode, 1, 1);

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return {
    ...whitespaces,
    ...quotes,
    content,
    loc: node.loc,
    parent: node.parent as unknown as Node,
    range: [node.range[0] - 1, node.range[1] + 1], // include quotes in range
    raw,
    type: "StringLiteral"
  };

}

function getLiteralsBySvelteMustacheTag(ctx: Rule.RuleContext, node: ESTemplateLiteral): TemplateLiteral[] {
  return node.quasis.map(quasi => {
    if(!hasESNodeParentExtension(quasi)){
      return;
    }
    return getLiteralByESTemplateElement(ctx, quasi);
  }).filter((literal): literal is TemplateLiteral => literal !== undefined);
}

function isSvelteAttribute(attribute:
  | SvelteAttribute
  | SvelteDirective
  | SvelteGenericsDirective
  | SvelteShorthandAttribute
  | SvelteSpecialDirective
  | SvelteSpreadAttribute
  | SvelteStyleDirective): attribute is SvelteAttribute {
  return "key" in attribute && "name" in attribute.key && typeof attribute.key.name === "string";
}

function isSvelteStringLiteral(node: ESBaseNode): node is SvelteLiteral {
  return node.type === "SvelteLiteral";
}

function isSvelteMustacheTagWithESSimpleStringLiteral(node: ESBaseNode): node is SvelteMustacheTagText & { expression: ESSimpleStringLiteral; } {
  return node.type === "SvelteMustacheTag" && "expression" in node &&
    isESNode(node.expression) &&
    isESSimpleStringLiteral(node.expression);
}

function isSvelteMustacheTagWithESTemplateLiteral(node: ESBaseNode): node is SvelteMustacheTagText & { expression: ESTemplateLiteral; } {
  return node.type === "SvelteMustacheTag" && "expression" in node &&
    isESNode(node.expression) &&
    node.expression.type === "TemplateLiteral";
}
