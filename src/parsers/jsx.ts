import {
  ES_CONTAINER_TYPES_TO_INSERT_BRACES,
  ES_CONTAINER_TYPES_TO_REPLACE_QUOTES,
  getLiteralsByESMatchers,
  getLiteralsByESNodeAndRegex,
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  hasESNodeParentExtension,
  isESNode,
  isESSimpleStringLiteral,
  isESTemplateLiteral
} from "better-tailwindcss:parsers/es.js";
import { isAttributesMatchers, isAttributesName, isAttributesRegex } from "better-tailwindcss:utils/matchers.js";
import { deduplicateLiterals, matchesName } from "better-tailwindcss:utils/utils.js";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode, TemplateLiteral as ESTemplateLiteral } from "estree";
import type { JSXAttribute, BaseNode as JSXBaseNode, JSXExpressionContainer, JSXOpeningElement } from "estree-jsx";

import type { ESSimpleStringLiteral } from "better-tailwindcss:parsers/es.js";
import type { Literal, LiteralValueQuotes, MultilineMeta } from "better-tailwindcss:types/ast.js";
import type { Attributes } from "better-tailwindcss:types/rule.js";


export const JSX_CONTAINER_TYPES_TO_REPLACE_QUOTES = [
  ...ES_CONTAINER_TYPES_TO_REPLACE_QUOTES,
  "JSXAttribute",
  "JSXExpressionContainer"
];

export const JSX_CONTAINER_TYPES_TO_INSERT_BRACES = [
  ...ES_CONTAINER_TYPES_TO_INSERT_BRACES,
  "JSXAttribute"
];


export function getLiteralsByJSXAttribute(ctx: Rule.RuleContext, attribute: JSXAttribute, attributes: Attributes): Literal[] {
  const value = attribute.value;

  const literals = attributes.reduce<Literal[]>((literals, attributes) => {
    if(!value){ return literals; }

    const name = getAttributeName(attribute);

    if(typeof name !== "string"){
      return literals;
    }

    if(isAttributesName(attributes)){
      if(!matchesName(attributes.toLowerCase(), name.toLowerCase())){ return literals; }
      literals.push(...getLiteralsByJSXAttributeValue(ctx, value));
    } else if(isAttributesRegex(attributes)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, attributes));
    } else if(isAttributesMatchers(attributes)){
      if(!matchesName(attributes[0].toLowerCase(), name.toLowerCase())){ return literals; }
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

function getAttributeName(attribute: JSXAttribute): string | undefined {
  if(attribute.name.type === "JSXIdentifier"){
    return attribute.name.name;
  }
  if(attribute.name.type === "JSXNamespacedName"){
    return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
  }
}

function getLiteralsByJSXAttributeValue(ctx: Rule.RuleContext, value: JSXAttribute["value"]): Literal[] {

  if(!value){ return []; }

  if(isESSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isJSXExpressionContainerWithESSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value.expression);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isJSXExpressionContainerWithESTemplateLiteral(value)){
    return getLiteralsByJSXTemplateLiteral(ctx, value.expression);
  }

  return [];

}

function getStringLiteralByJSXStringLiteral(ctx: Rule.RuleContext, node: ESSimpleStringLiteral): Literal | undefined {
  const literal = getStringLiteralByESStringLiteral(ctx, node);
  const multilineQuotes = getMultilineQuotes(node);

  if(!literal){
    return;
  }

  return {
    ...literal,
    ...multilineQuotes
  };
}

function getLiteralsByJSXTemplateLiteral(ctx: Rule.RuleContext, node: ESTemplateLiteral): Literal[] {
  const literals = getLiteralsByESTemplateLiteral(ctx, node);

  return literals.map(literal => {
    if(!hasESNodeParentExtension(node)){
      return literal;
    }

    const multilineQuotes = getMultilineQuotes(node);

    return {
      ...literal,
      ...multilineQuotes
    };
  });
}

function getMultilineQuotes(node: ESBaseNode & Rule.NodeParentExtension): MultilineMeta {
  const surroundingBraces = JSX_CONTAINER_TYPES_TO_INSERT_BRACES.includes(node.parent.type);
  const multilineQuotes: LiteralValueQuotes[] = JSX_CONTAINER_TYPES_TO_REPLACE_QUOTES.includes(node.parent.type)
    ? ["`"]
    : [];

  return {
    multilineQuotes,
    surroundingBraces
  };
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
