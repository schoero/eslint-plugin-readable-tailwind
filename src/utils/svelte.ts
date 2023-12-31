import {
  getLiteralByJSXTemplateElement,
  getStringLiteralByJSXStringLiteral,
  isSimpleStringLiteral
} from "readable-tailwind:utils:jsx.js";
import { getWhitespace } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { BaseNode as JSXBaseNode, Node as JSXNode, TemplateLiteral as JSXTemplateLiteral } from "estree-jsx";
import type { Literal, Node, QuoteMeta, StringLiteral, TemplateLiteral } from "src/types/ast.js";
import type {
  SvelteAttribute,
  SvelteDirective,
  SvelteLiteral,
  SvelteShorthandAttribute,
  SvelteSpecialDirective,
  SvelteSpreadAttribute,
  SvelteStartTag,
  SvelteStyleDirective
} from "svelte-eslint-parser/lib/ast/index.js";


export function getSvelteAttributes(ctx: Rule.RuleContext, classAttributes: string[], node: SvelteStartTag): SvelteAttribute[] {
  return node.attributes.reduce<SvelteAttribute[]>((acc, attribute) => {
    if(isSvelteAttribute(attribute) && classAttributes.includes(attribute.key.name)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}


export function getSvelteClassAttributeLiterals(ctx: Rule.RuleContext, attribute: SvelteAttribute): Literal[] {

  const value = attribute.value[0];

  // class="a b"
  if(value.type === "SvelteLiteral"){
    const stringLiteral = getStringLiteralBySvelteStringLiteral(ctx, value);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  // class={`a b`}
  if(value.type === "SvelteMustacheTag" && value.expression.type === "TemplateLiteral"){
    return getLiteralsBySvelteMustacheTag(ctx, value.expression);
  }

  // class={"a b"}
  if(value.type === "SvelteMustacheTag" && value.expression.type === "Literal" && isSimpleStringLiteral(value.expression)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value.expression);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  return [];

}

function getStringLiteralBySvelteStringLiteral(ctx: Rule.RuleContext, node: SvelteLiteral): StringLiteral | undefined {

  const content = node.value;

  const quotes = getQuotesByNode(ctx, node);
  const whitespaces = getWhitespace(content);

  const raw = (quotes.openingQuote ?? "") + node.value + (quotes.closingQuote ?? "");

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

function getQuotesByNode(ctx: Rule.RuleContext, node: JSXBaseNode): QuoteMeta {
  const openingQuote = ctx.sourceCode.getTokenByRangeStart((node.range?.[0] ?? 0) - 1);
  const closingQuote = ctx.sourceCode.getTokenByRangeStart(node.range?.[1] ?? 0);

  return {
    closingQuote: closingQuote?.value === "'" || closingQuote?.value === '"' ? closingQuote.value : undefined,
    openingQuote: openingQuote?.value === "'" || openingQuote?.value === '"' ? openingQuote.value : undefined
  };
}

function getLiteralsBySvelteMustacheTag(ctx: Rule.RuleContext, node: JSXTemplateLiteral): TemplateLiteral[] {
  return node.quasis.map(quasi => {
    if(!hasNodeParentExtension(quasi)){
      return;
    }
    return getLiteralByJSXTemplateElement(ctx, quasi);
  }).filter((literal): literal is TemplateLiteral => literal !== undefined);
}

function isSvelteAttribute(attribute:
  | SvelteAttribute
  | SvelteDirective
  | SvelteShorthandAttribute
  | SvelteSpecialDirective
  | SvelteSpreadAttribute
  | SvelteStyleDirective): attribute is SvelteAttribute {
  return "key" in attribute && "name" in attribute.key && typeof attribute.key.name === "string";
}

function hasNodeParentExtension(node: JSXNode): node is Rule.Node & Rule.NodeParentExtension {
  return "parent" in node;
}
