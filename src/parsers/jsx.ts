import {
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  isESNode,
  isESSimpleStringLiteral,
  isESTemplateLiteral
} from "readable-tailwind:flavors:es";

import type { Rule } from "eslint";
import type { TemplateLiteral as ESTemplateLiteral } from "estree";
import type { BaseNode as JSXBaseNode, JSXAttribute, JSXExpressionContainer, JSXOpeningElement } from "estree-jsx";

import type { ESSimpleStringLiteral } from "readable-tailwind:flavors:es";
import type { Literal } from "readable-tailwind:types:ast";


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

export function isJSXExpressionContainerWithESSimpleStringLiteral(node: JSXBaseNode): node is JSXExpressionContainer & { expression: ESSimpleStringLiteral; } {
  return node.type === "JSXExpressionContainer" && "expression" in node &&
    isESNode(node.expression) &&
    isESSimpleStringLiteral(node.expression);
}

export function isJSXExpressionContainerWithESTemplateLiteral(node: JSXBaseNode): node is JSXExpressionContainer & { expression: ESTemplateLiteral; } {
  return node.type === "JSXExpressionContainer" && "expression" in node &&
    isESNode(node.expression) &&
    isESTemplateLiteral(node.expression);
}

export function isJSXAttribute(node: JSXBaseNode): node is JSXAttribute {
  return node.type === "JSXAttribute";
}
