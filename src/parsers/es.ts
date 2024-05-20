import { MatcherType } from "readable-tailwind:types:rule.js";
import {
  getLiteralNodesByMatchers,
  getObjectPath,
  isCalleeMatchers,
  isCalleeName,
  isCalleeRegex,
  isInsideConditionalExpressionTest,
  isInsideLogicalExpressionLeft,
  isVariableMatchers,
  isVariableName,
  isVariableRegex,
  matchesPathPattern
} from "readable-tailwind:utils:matchers";
import { getLiteralsByESNodeAndRegex } from "readable-tailwind:utils:regex";
import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type {
  BaseNode as ESBaseNode,
  CallExpression as ESCallExpression,
  Expression as ESExpression,
  Identifier as ESIdentifier,
  Node as ESNode,
  SimpleLiteral as ESSimpleLiteral,
  SpreadElement as ESSpreadElement,
  TemplateElement as ESTemplateElement,
  TemplateLiteral as ESTemplateLiteral,
  VariableDeclarator as ESVariableDeclarator
} from "estree";

import type { BracesMeta, Literal, Node, StringLiteral, TemplateLiteral } from "readable-tailwind:types:ast";
import type { Callees, Matcher, MatcherFunctions, Variables } from "readable-tailwind:types:rule.js";


export function getLiteralsByESVariableDeclarator(ctx: Rule.RuleContext, node: ESVariableDeclarator, variables: Variables): Literal[] {

  const literals = variables.reduce<Literal[]>((literals, variable) => {

    if(!node.init){ return literals; }
    if(!isESVariableSymbol(node.id)){ return literals; }

    if(isVariableName(variable)){
      if(variable !== node.id.name){ return literals; }
      literals.push(...getLiteralsByESExpression(ctx, [node.init]));
    } else if(isVariableRegex(variable)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, node, variable));
    } else if(isVariableMatchers(variable)){
      if(variable[0] !== node.id.name){ return literals; }
      literals.push(...getLiteralsByESMatchers(ctx, node.init, variable[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

export function getLiteralsByESCallExpression(ctx: Rule.RuleContext, node: ESCallExpression, callees: Callees): Literal[] {

  const literals = callees.reduce<Literal[]>((literals, callee) => {
    if(!isESCalleeSymbol(node.callee)){ return literals; }

    if(isCalleeName(callee)){
      if(callee !== node.callee.name){ return literals; }
      literals.push(...getLiteralsByESExpression(ctx, node.arguments));
    } else if(isCalleeRegex(callee)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, node, callee));
    } else if(isCalleeMatchers(callee)){
      if(callee[0] !== node.callee.name){ return literals; }
      literals.push(...getLiteralsByESMatchers(ctx, node, callee[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

export function getLiteralsByESLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {

  if(isESSimpleStringLiteral(node)){
    const literal = getStringLiteralByESStringLiteral(ctx, node);
    return literal ? [literal] : [];
  }

  if(isESTemplateLiteral(node)){
    return getLiteralsByESTemplateLiteral(ctx, node);
  }

  if(isESTemplateElement(node) && hasESNodeParentExtension(node)){
    const literal = getLiteralByESTemplateElement(ctx, node);
    return literal ? [literal] : [];
  }

  return [];

}

export function getLiteralsByESMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: Matcher[]): Literal[] {

  const matcherFunctions = getESMatcherFunctions(matchers);
  const literalNodes = getLiteralNodesByMatchers(ctx, node, matcherFunctions);

  const literals = literalNodes.reduce<Literal[]>((literals, literalNode) => {
    literals.push(...getLiteralsByESLiteralNode(ctx, literalNode));
    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

export function getLiteralNodesByRegex(ctx: Rule.RuleContext, node: ESNode, regex: RegExp): ESNode[] {

  const sourceCode = ctx.sourceCode.getText(node);

  const matchedNodes: ESNode[] = [];

  const matches = sourceCode.matchAll(regex);

  for(const groups of matches){
    if(!groups.indices || groups.indices.length < 2){ continue; }

    for(const [startIndex] of groups.indices.slice(1)){

      const literalNode = ctx.sourceCode.getNodeByRangeIndex((node.range?.[0] ?? 0) + startIndex);

      if(!literalNode){ continue; }

      matchedNodes.push(literalNode);

    }
  }

  return matchedNodes;

}

export function getStringLiteralByESStringLiteral(ctx: Rule.RuleContext, node: ESSimpleStringLiteral): StringLiteral | undefined {

  const raw = node.raw;
  const content = node.value;

  if(!raw || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return {
    ...quotes,
    ...whitespaces,
    content,
    loc: node.loc,
    node: node as unknown as Node,
    parent: node.parent as Node,
    range: node.range,
    raw,
    type: "StringLiteral"
  };

}

function getLiteralByESTemplateElement(ctx: Rule.RuleContext, node: ESTemplateElement & Rule.Node): TemplateLiteral | undefined {

  const raw = ctx.sourceCode.getText(node);
  const content = node.value.raw;

  if(!raw || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const braces = getBracesByString(ctx, raw);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    content,
    loc: node.loc,
    node: node as unknown as Node,
    parent: node.parent as Node,
    range: node.range,
    raw,
    type: "TemplateLiteral"
  };

}

function getLiteralsByESExpression(ctx: Rule.RuleContext, args: (ESExpression | ESSpreadElement)[]): Literal[] {
  return args.reduce<Literal[]>((acc, node) => {
    if(node.type === "SpreadElement"){ return acc; }

    acc.push(...getLiteralsByESLiteralNode(ctx, node));
    return acc;
  }, []);
}

export function getLiteralsByESTemplateLiteral(ctx: Rule.RuleContext, node: ESTemplateLiteral): Literal[] {
  return node.quasis.map(quasi => {
    if(!hasESNodeParentExtension(quasi)){
      return;
    }
    return getLiteralByESTemplateElement(ctx, quasi);
  }).filter((literal): literal is TemplateLiteral => literal !== undefined);
}

export function findParentESTemplateLiteralByESTemplateElement(node: ESNode & Partial<Rule.NodeParentExtension>): ESTemplateLiteral | undefined {
  if(!hasESNodeParentExtension(node)){ return; }
  if(node.parent.type === "TemplateLiteral"){ return node.parent; }
  return findParentESTemplateLiteralByESTemplateElement(node.parent);
}

export interface ESSimpleStringLiteral extends Rule.NodeParentExtension, ESSimpleLiteral {
  value: string;
}

export function isESObjectKey(node: Node | ESBaseNode & Rule.NodeParentExtension) {
  return (
    node.parent.type === "Property" &&
    node.parent.parent.type === "ObjectExpression" &&
    node.parent.key === node
  );
}

export function isInsideObjectValue(node: ESBaseNode & Partial<Rule.NodeParentExtension>) {
  if(!hasESNodeParentExtension(node)){ return false; }

  if(
    node.parent.type === "Property" &&
    node.parent.parent.type === "ObjectExpression" &&
    node.parent.value === node
  ){
    return true;
  }

  return isInsideObjectValue(node.parent);
}

export function isESSimpleStringLiteral(node: ESBaseNode): node is ESSimpleStringLiteral {
  return (
    node.type === "Literal" &&
    "value" in node &&
    typeof node.value === "string"
  );
}

export function isESStringLike(node: ESBaseNode): node is ESSimpleStringLiteral | ESTemplateElement {
  return isESSimpleStringLiteral(node) || isESTemplateElement(node);
}

export function isESTemplateLiteral(node: ESBaseNode): node is ESTemplateLiteral {
  return node.type === "TemplateLiteral";
}

export function isESTemplateElement(node: ESBaseNode): node is ESTemplateElement {
  return node.type === "TemplateElement";
}

export function isESNode(node: unknown): node is ESNode {
  return (
    node !== null &&
    typeof node === "object" &&
    "type" in node
  );
}

export function isESCallExpression(node: ESBaseNode): node is ESCallExpression {
  return node.type === "CallExpression";
}

function isESCalleeSymbol(node: ESBaseNode & Partial<Rule.NodeParentExtension>): node is ESIdentifier {
  return node.type === "Identifier" && !!node.parent && isESCallExpression(node.parent);
}

export function isESVariableDeclarator(node: ESBaseNode): node is ESVariableDeclarator {
  return node.type === "VariableDeclarator";
}

function isESVariableSymbol(node: ESBaseNode & Partial<Rule.NodeParentExtension>): node is ESIdentifier {
  return node.type === "Identifier" && !!node.parent && isESVariableDeclarator(node.parent);
}

export function hasESNodeParentExtension(node: ESBaseNode): node is Rule.Node & Rule.NodeParentExtension {
  return "parent" in node && !!node.parent;
}

function getBracesByString(ctx: Rule.RuleContext, raw: string): BracesMeta {
  const closingBraces = raw.startsWith("}") ? "}" : undefined;
  const openingBraces = raw.endsWith("${") ? "${" : undefined;

  return {
    closingBraces,
    openingBraces
  };
}

function getESMatcherFunctions(matchers: Matcher[]): MatcherFunctions {
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
            isESStringLike(node)
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
