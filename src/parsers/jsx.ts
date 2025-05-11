import {
  getLiteralsByESMatchers,
  getLiteralsByESNodeAndRegex,
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  isESNode,
  isESSimpleStringLiteral,
  isESTemplateLiteral
} from "better-tailwindcss:parsers:es.js";
import { isAttributesMatchers, isAttributesName, isAttributesRegex } from "better-tailwindcss:utils:matchers.js";
import { deduplicateLiterals, matchesName } from "better-tailwindcss:utils:utils.js";

import type { Rule } from "eslint";
import type { TemplateLiteral as ESTemplateLiteral } from "estree";
import type { JSXAttribute, BaseNode as JSXBaseNode, JSXExpressionContainer, JSXOpeningElement } from "estree-jsx";

import type { ESSimpleStringLiteral } from "better-tailwindcss:parsers:es.js";
import type { Literal } from "better-tailwindcss:types:ast.js";
import type { Attributes } from "better-tailwindcss:types:rule.js";


export function getLiteralsByJSXAttribute(ctx: Rule.RuleContext, attribute: JSXAttribute, attributes: Attributes): Literal[] {
  const value = attribute.value;

  const literals = attributes.reduce<Literal[]>((literals, attributes) => {
    if(!value){ return literals; }

    if(isAttributesName(attributes)){
      if(typeof attribute.name.name !== "string" || !matchesName(attributes.toLowerCase(), attribute.name.name.toLowerCase())){ return literals; }
      literals.push(...getLiteralsByJSXAttributeValue(ctx, value));
    } else if(isAttributesRegex(attributes)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, attributes));
    } else if(isAttributesMatchers(attributes)){
      if(typeof attribute.name.name !== "string" || !matchesName(attributes[0].toLowerCase(), attribute.name.name.toLowerCase())){ return literals; }
      literals.push(...getLiteralsByESMatchers(ctx, value, attributes[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

export function getAttributesByJSXElement(ctx: Rule.RuleContext, node: JSXOpeningElement): JSXAttribute[] {
  return node.attributes.reduce<JSXAttribute[]>((acc, attribute) => {
    if(isJSXAttribute(attribute)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}

function getLiteralsByJSXAttributeValue(ctx: Rule.RuleContext, value: JSXAttribute["value"]): Literal[] {

  if(!value){ return []; }

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
