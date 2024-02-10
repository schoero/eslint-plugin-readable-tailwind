import {
  getLiteralByESTemplateElement,
  getLiteralsByESCallExpressionAndStringCallee,
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  hasESNodeParentExtension,
  isESNode,
  isESSimpleStringLiteral
} from "readable-tailwind:parsers:es.js";
import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type {
  BaseNode as ESBaseNode,
  CallExpression as ESCallExpression,
  Node as ESNode,
  TemplateLiteral as ESTemplateLiteral
} from "estree";
import type {
  SvelteAttribute,
  SvelteDirective,
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
import type { CalleeRegex, Callees } from "readable-tailwind:types:rule.js";


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

export function getLiteralsBySvelteCallExpression(ctx: Rule.RuleContext, node: ESCallExpression, callees: Callees): Literal[] {
  const literals = callees.reduce<Literal[]>((literals, callee) => {

    if(node.callee.type !== "Identifier"){ return literals; }

    if(typeof callee === "string"){
      if(callee !== node.callee.name){ return literals; }

      literals.push(...getLiteralsByESCallExpressionAndStringCallee(ctx, node.arguments));
    } else {
      literals.push(...getLiteralsBySvelteCallExpressionAndRegexCallee(ctx, node, callee));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);
}

function getLiteralsBySvelteCallExpressionAndRegexCallee(ctx: Rule.RuleContext, node: ESNode, regexCallee: CalleeRegex): Literal[] {

  const [containerRegexString, stringLiteralRegexString] = regexCallee;

  const sourceCode = ctx.sourceCode.getText(node);

  const containerRegex = new RegExp(containerRegexString, "g");
  const stringLiteralRegex = new RegExp(stringLiteralRegexString, "g");
  const containers = sourceCode.matchAll(containerRegex);

  const matchedLiterals: Literal[] = [];

  for(const container of containers){
    const stringLiterals = container[0].matchAll(stringLiteralRegex);

    for(const stringLiteral of stringLiterals){
      if(!stringLiteral.index){ continue; }

      const literalNode = ctx.sourceCode.getNodeByRangeIndex((node.range?.[0] ?? 0) + stringLiteral.index);

      if(!literalNode){ continue; }

      const literals = isESSimpleStringLiteral(literalNode)
        ? getStringLiteralByESStringLiteral(ctx, literalNode)
        : isSvelteMustacheTagWithESTemplateLiteral(literalNode)
          ? getLiteralsByESTemplateLiteral(ctx, literalNode.expression)
          : undefined;

      if(isSvelteMustacheTagWithESTemplateLiteral(literalNode)){
        console.log(literalNode);
      }

      if(literals === undefined){ continue; }

      matchedLiterals.push(
        ...Array.isArray(literals) ? literals : [literals]
      );
    }

  }

  return matchedLiterals;

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
