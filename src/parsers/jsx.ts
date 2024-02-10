import {
  getLiteralsByESCallExpressionAndStringCallee,
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  isESNode,
  isESSimpleStringLiteral,
  isESTemplateLiteral
} from "readable-tailwind:parsers:es";
import { deduplicateLiterals } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { TemplateLiteral as ESTemplateLiteral } from "estree";
import type {
  BaseNode as JSXBaseNode,
  CallExpression as JSXCallExpression,
  JSXAttribute,
  JSXExpressionContainer,
  JSXOpeningElement,
  Node as JSXNode
} from "estree-jsx";

import type { ESSimpleStringLiteral } from "readable-tailwind:parsers:es";
import type { Literal } from "readable-tailwind:types:ast";
import type { CalleeRegex, Callees } from "readable-tailwind:types:rule.js";


export function getLiteralsByJSXClassAttribute(ctx: Rule.RuleContext, attribute: JSXAttribute): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  if(isESSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByESStringLiteral(ctx, value);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isJSXExpressionContainerWithESSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByESStringLiteral(ctx, value.expression);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isJSXExpressionContainerWithESTemplateLiteral(value)){
    return getLiteralsByESTemplateLiteral(ctx, value.expression);
  }

  return [];

}

export function getJSXAttributes(ctx: Rule.RuleContext, classNames: string[], node: JSXOpeningElement): JSXAttribute[] {
  return node.attributes.reduce<JSXAttribute[]>((acc, attribute) => {
    if(isJSXAttribute(attribute) &&
      typeof attribute.name.name === "string" &&
      classNames.includes(attribute.name.name)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}

export function getLiteralsByJSXCallExpression(ctx: Rule.RuleContext, node: JSXCallExpression, callees: Callees): Literal[] {
  const literals = callees.reduce<Literal[]>((literals, callee) => {

    if(node.callee.type !== "Identifier"){ return literals; }

    if(typeof callee === "string"){
      if(callee !== node.callee.name){ return literals; }

      literals.push(...getLiteralsByESCallExpressionAndStringCallee(ctx, node.arguments));
    } else {
      literals.push(...getLiteralsByJSXCallExpressionAndRegexCallee(ctx, node, callee));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);
}

function getLiteralsByJSXCallExpressionAndRegexCallee(ctx: Rule.RuleContext, node: JSXNode, regexCallee: CalleeRegex): Literal[] {

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
        : isJSXExpressionContainerWithESTemplateLiteral(literalNode)
          ? getLiteralsByESTemplateLiteral(ctx, literalNode.expression)
          : undefined;

      if(literals === undefined){ continue; }

      matchedLiterals.push(
        ...Array.isArray(literals) ? literals : [literals]
      );
    }

  }

  return matchedLiterals;

}

function isJSXExpressionContainerWithESSimpleStringLiteral(node: JSXBaseNode): node is JSXExpressionContainer & { expression: ESSimpleStringLiteral; } {
  return node.type === "JSXExpressionContainer" && "expression" in node &&
    isESNode(node.expression) &&
    isESSimpleStringLiteral(node.expression);
}

function isJSXExpressionContainerWithESTemplateLiteral(node: JSXBaseNode): node is JSXExpressionContainer & { expression: ESTemplateLiteral; } {
  return node.type === "JSXExpressionContainer" && "expression" in node &&
    isESNode(node.expression) &&
    isESTemplateLiteral(node.expression);
}

function isJSXAttribute(node: JSXBaseNode): node is JSXAttribute {
  return node.type === "JSXAttribute";
}
