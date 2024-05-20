import {
  getLiteralsByESLiteralNode,
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
import type { VAttribute, VDirective, VLiteral, VStartTag } from "vue-eslint-parser/ast";

import type { Literal, Node, StringLiteral } from "readable-tailwind:types:ast.js";
import type { ClassAttributes, Matcher, MatcherFunctions } from "readable-tailwind:types:rule.js";


export function getAttributesByVueStartTag(ctx: Rule.RuleContext, node: VStartTag): (VAttribute | VDirective)[] {
  return node.attributes;
}


export function getLiteralsByVueClassAttribute(ctx: Rule.RuleContext, attribute: VAttribute | VDirective, classAttributes: ClassAttributes): Literal[] {

  if(attribute.value === null){
    return [];
  }

  const value = attribute.value;

  const literals = classAttributes.reduce<Literal[]>((literals, classAttribute) => {
    if(isClassAttributeName(classAttribute)){
      if(classAttribute !== attribute.key.name){ return literals; }
      literals.push(...getLiteralsByVueLiteralNode(ctx, value));
    } else if(isClassAttributeRegex(classAttribute)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, classAttribute));
    } else if(isClassAttributeMatchers(classAttribute)){
      if(getVueAttributeName(attribute) !== classAttribute[0]){ return literals; }
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

  if(isESStringLike(node)){
    return getLiteralsByESLiteralNode(ctx, node);
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

function getStringLiteralByVueStringLiteral(ctx: Rule.RuleContext, node: VLiteral): StringLiteral {

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

function getVueAttributeName(attribute: VAttribute | VDirective): string | undefined {
  if(isVueAttribute(attribute)){
    return attribute.key.name;
  }

  if(isVueDirective(attribute)){
    if(attribute.key.argument?.type === "VIdentifier"){
      return `v-${attribute.key.name.name}:${attribute.key.argument.name}`;
    }
  }
}

function isVueAttribute(attribute: VAttribute | VDirective): attribute is VAttribute {
  return attribute.key.type === "VIdentifier";
}

function isVueDirective(attribute: VAttribute | VDirective): attribute is VDirective {
  return attribute.key.type === "VDirectiveKey";
}

function isVueLiteralNode(node: ESBaseNode): node is VLiteral {
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
