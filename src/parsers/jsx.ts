import {
  getLiteralsByESMatchers,
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  isESNode,
  isESSimpleStringLiteral,
  isESTemplateLiteral
} from "readable-tailwind:parsers:es.js";
import {
  isClassAttributeMatchers,
  isClassAttributeName,
  isClassAttributeRegex
} from "readable-tailwind:utils:matchers.js";
import { getLiteralsByESNodeAndRegex } from "readable-tailwind:utils:regex.js";
import { deduplicateLiterals } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { TemplateLiteral as ESTemplateLiteral } from "estree";
import type { JSXAttribute, BaseNode as JSXBaseNode, JSXExpressionContainer, JSXOpeningElement } from "estree-jsx";

import type { ESSimpleStringLiteral } from "readable-tailwind:parsers:es.js";
import type { Literal } from "readable-tailwind:types:ast.js";
import type { ClassAttributes } from "readable-tailwind:types:rule.js";


export function getLiteralsByJSXClassAttribute(ctx: Rule.RuleContext, attribute: JSXAttribute, classAttributes: ClassAttributes): Literal[] {
  const value = attribute.value;

  const literals = classAttributes.reduce<Literal[]>((literals, classAttribute) => {
    if(!value){ return literals; }

    if(isClassAttributeName(classAttribute)){
      if(typeof attribute.name.name !== "string" || classAttribute.toLowerCase() !== attribute.name.name.toLowerCase()){ return literals; }
      literals.push(...getLiteralsByJSXAttributeValue(ctx, value));
    } else if(isClassAttributeRegex(classAttribute)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, classAttribute));
    } else if(isClassAttributeMatchers(classAttribute)){
      if(typeof attribute.name.name !== "string" || classAttribute[0].toLowerCase() !== attribute.name.name.toLowerCase()){ return literals; }
      literals.push(...getLiteralsByESMatchers(ctx, value, classAttribute[1]));
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
