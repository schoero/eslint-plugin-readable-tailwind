import {
  hasESNodeParentExtension,
  isESObjectKey,
  isESStringLike,
  isInsideObjectValue
} from "readable-tailwind:parsers:es.js";
import { MatcherType } from "readable-tailwind:types:rule.js";
import {
  getLiteralNodesByMatchers,
  getObjectPath,
  isClassAttributeMatchers,
  isClassAttributeName,
  isClassAttributeRegex,
  isInsideConditionalExpressionTest,
  isInsideLogicalExpressionLeft,
  matchesPathPattern
} from "readable-tailwind:utils:matchers.js";
import { getLiteralsByESNodeAndRegex } from "readable-tailwind:utils:regex.js";
import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode, Node as ESNode } from "estree";
import type { AST } from "vue-eslint-parser";

import type { Literal, Node, StringLiteral } from "readable-tailwind:types:ast.js";
import type { ClassAttributes, Matcher, MatcherFunctions } from "readable-tailwind:types:rule.js";


export function getAttributesByVueStartTag(ctx: Rule.RuleContext, node: AST.VStartTag): AST.VAttribute[] {
  return node.attributes.reduce<AST.VAttribute[]>((acc, attribute) => {
    if(isVueAttribute(attribute)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}


export function getLiteralsByVueClassAttribute(ctx: Rule.RuleContext, attribute: AST.VAttribute, classAttributes: ClassAttributes): Literal[] {

  if(attribute.value === null){
    return [];
  }

  const value = attribute.value;

  const literals = classAttributes.reduce<Literal[]>((literals, classAttribute) => {
    if(isClassAttributeName(classAttribute)){
      if(classAttribute.toLowerCase() !== attribute.key.name.toLowerCase()){ return literals; }
      literals.push(...getLiteralsByVueLiteralNode(ctx, value));
    } else if(isClassAttributeRegex(classAttribute)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, classAttribute));
    } else if(isClassAttributeMatchers(classAttribute)){
      if(classAttribute[0].toLowerCase() !== attribute.key.name.toLowerCase()){ return literals; }
      literals.push(...getLiteralsByVueMatchers(ctx, value, classAttribute[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

function getLiteralsByVueLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {
  if(isVueLiteralNode(node)){
    const literal = getStringLiteralByVueStringLiteral(ctx, node);

    return [literal];
  }

  return [];
}

function getLiteralsByVueMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: Matcher[]): Literal[] {
  const matcherFunctions = getVueMatcherFunctions(matchers);
  const literalNodes = getLiteralNodesByMatchers(ctx, node, matcherFunctions);

  const literals = literalNodes.reduce<Literal[]>((literals, literalNode) => {
    literals.push(...getLiteralsByVueLiteralNode(ctx, literalNode));
    return literals;
  }, []);

  return deduplicateLiterals(literals);
}

function getStringLiteralByVueStringLiteral(ctx: Rule.RuleContext, node: AST.VLiteral): StringLiteral {

  const content = node.value;
  const raw = ctx.sourceCode.getText(node as unknown as ESNode);

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return {
    ...whitespaces,
    ...quotes,
    content,
    loc: node.loc,
    node: node as unknown as Node,
    parent: node.parent as unknown as Node,
    range: [node.range[0], node.range[1]],
    raw,
    type: "StringLiteral"
  };

}

function isVueAttribute(attribute: AST.VAttribute | AST.VDirective): attribute is AST.VAttribute {
  return "key" in attribute && "name" in attribute.key && typeof attribute.key.name === "string";
}

function isVueLiteralNode(node: ESBaseNode): node is AST.VLiteral {
  return node.type === "VLiteral";
}

function getVueMatcherFunctions(matchers: Matcher[]): MatcherFunctions {
  return matchers.reduce<MatcherFunctions>((matcherFunctions, matcher) => {
    switch (matcher.match){
      case MatcherType.String: {
        matcherFunctions.push(node => {

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }
          if(!hasESNodeParentExtension(node)){ return false; }

          return (
            !isESObjectKey(node) &&
            !isInsideObjectValue(node) &&
            (isESStringLike(node) || isVueLiteralNode(node))
          );
        });
        break;
      }
      case MatcherType.ObjectKey: {
        matcherFunctions.push(node => {

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }

          if(!hasESNodeParentExtension(node)){ return false; }
          if(!isESObjectKey(node)){ return false; }

          const path = getObjectPath(node);

          return path && matcher.pathPattern ? matchesPathPattern(path, matcher.pathPattern) : true;
        });
        break;
      }
      case MatcherType.ObjectValue: {
        matcherFunctions.push(node => {

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }
          if(!hasESNodeParentExtension(node)){ return false; }
          if(isESObjectKey(node)){ return false; }

          const path = getObjectPath(node);
          const matchesPattern = path !== undefined &&
            matcher.pathPattern
            ? matchesPathPattern(path, matcher.pathPattern)
            : true;
          return isInsideObjectValue(node) && isESStringLike(node) && matchesPattern;
        });
        break;
      }
    }
    return matcherFunctions;
  }, []);
}
