import { MatcherType } from "readable-tailwind:types:rule.js";
import {
  findMatchingParentNodes,
  getLiteralNodesByMatchers,
  isCalleeMatchers,
  isCalleeName,
  isCalleeRegex,
  isInsideConditionalExpressionTest,
  isInsideLogicalExpressionLeft,
  isTagMatchers,
  isTagName,
  isTagRegex,
  isVariableMatchers,
  isVariableName,
  isVariableRegex,
  matchesPathPattern
} from "readable-tailwind:utils:matchers.js";
import { getLiteralsByNodeAndRegex } from "readable-tailwind:utils:regex.js";
import {
  deduplicateLiterals,
  getIndentation,
  getQuotes,
  getWhitespace,
  matchesName,
  splitClasses
} from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type {
  BaseNode as ESBaseNode,
  CallExpression as ESCallExpression,
  Expression as ESExpression,
  Identifier as ESIdentifier,
  Node as ESNode,
  SimpleLiteral as ESSimpleLiteral,
  SpreadElement as ESSpreadElement,
  TaggedTemplateExpression as ESTaggedTemplateExpression,
  TemplateElement as ESTemplateElement,
  TemplateLiteral as ESTemplateLiteral,
  VariableDeclarator as ESVariableDeclarator
} from "estree";

import type {
  BracesMeta,
  Literal,
  LiteralValueQuotes,
  MultilineMeta,
  StringLiteral,
  TemplateLiteral
} from "readable-tailwind:types:ast.js";
import type {
  Callees,
  Matcher,
  MatcherFunctions,
  RegexConfig,
  Tags,
  Variables
} from "readable-tailwind:types:rule.js";


export function getLiteralsByESVariableDeclarator(ctx: Rule.RuleContext, node: ESVariableDeclarator, variables: Variables): Literal[] {

  const literals = variables.reduce<Literal[]>((literals, variable) => {

    if(!node.init){ return literals; }
    if(!isESVariableSymbol(node.id)){ return literals; }

    if(isVariableName(variable)){
      if(!matchesName(variable, node.id.name)){ return literals; }
      literals.push(...getLiteralsByESExpression(ctx, [node.init]));
    } else if(isVariableRegex(variable)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, node, variable));
    } else if(isVariableMatchers(variable)){
      if(!matchesName(variable[0], node.id.name)){ return literals; }
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
      if(!matchesName(callee, node.callee.name)){ return literals; }
      literals.push(...getLiteralsByESExpression(ctx, node.arguments));
    } else if(isCalleeRegex(callee)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, node, callee));
    } else if(isCalleeMatchers(callee)){
      if(!matchesName(callee[0], node.callee.name)){ return literals; }
      literals.push(...getLiteralsByESMatchers(ctx, node, callee[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

export function getLiteralsByTaggedTemplateExpression(ctx: Rule.RuleContext, node: ESTaggedTemplateExpression, tags: Tags): Literal[] {

  const literals = tags.reduce<Literal[]>((literals, tag) => {
    if(!isTaggedTemplateSymbol(node.tag)){ return literals; }

    if(isTagName(tag)){
      if(tag !== node.tag.name){ return literals; }
      literals.push(...getLiteralsByESTemplateLiteral(ctx, node.quasi));
    } else if(isTagRegex(tag)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, node, tag));
    } else if(isTagMatchers(tag)){
      if(tag[0] !== node.tag.name){ return literals; }
      literals.push(...getLiteralsByESMatchers(ctx, node, tag[1]));
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
  const literals = literalNodes.flatMap(literalNode => getLiteralsByESLiteralNode(ctx, literalNode));
  return deduplicateLiterals(literals);
}

export function getLiteralsByESNodeAndRegex(
  ctx: Rule.RuleContext,
  node: ESBaseNode,
  regex: RegexConfig
): Literal[] {
  if(!hasESNodeParentExtension(node)){ return []; }

  return getLiteralsByNodeAndRegex(
    ctx,
    node,
    regex,
    {
      getLiteralsByMatchingNode: (node: unknown) => {
        if(!isESNode(node)){ return; }

        if(isESSimpleStringLiteral(node)){
          const literal = getStringLiteralByESStringLiteral(ctx, node);
          return literal ? [literal] : [];
        }

        if(isESTemplateElement(node) && hasESNodeParentExtension(node)){
          const templateLiteralNode = findParentESTemplateLiteralByESTemplateElement(node);
          return templateLiteralNode && getLiteralsByESTemplateLiteral(ctx, templateLiteralNode);
        }
      },
      getNodeByRangeStart: (start: number) => ctx.sourceCode.getNodeByRangeIndex(start),
      getNodeRange: node => isESNode(node) ? [node.range?.[0], node.range?.[1]] : undefined,
      getNodeSourceCode: node => isESNode(node) ? ctx.sourceCode.getText(node) : undefined
    }
  );
}

export function getStringLiteralByESStringLiteral(ctx: Rule.RuleContext, node: ESSimpleStringLiteral): StringLiteral | undefined {

  const raw = node.raw;
  const content = node.value;

  if(!raw || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const line = ctx.sourceCode.lines[node.loc.start.line - 1];

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);
  const supportsMultiline = !isESObjectKey(node);

  return {
    ...quotes,
    ...whitespaces,
    ...multilineQuotes,
    content,
    indentation,
    loc: node.loc,
    range: node.range,
    raw,
    supportsMultiline,
    type: "StringLiteral"
  };

}

function getLiteralByESTemplateElement(ctx: Rule.RuleContext, node: ESTemplateElement & Rule.Node): TemplateLiteral | undefined {

  const raw = ctx.sourceCode.getText(node);
  const content = node.value.raw;

  if(!raw || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const line = ctx.sourceCode.lines[node.parent.loc.start.line - 1];

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const braces = getBracesByString(ctx, raw);
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    ...multilineQuotes,
    content,
    indentation,
    loc: node.loc,
    range: node.range,
    raw,
    supportsMultiline: true,
    type: "TemplateLiteral"
  };

}

function getMultilineQuotes(node: ESNode & Rule.NodeParentExtension): MultilineMeta {
  const containerTypesToReplaceQuotes = [
    "JSXAttribute",
    "JSXExpressionContainer",
    "ArrayExpression",
    "Property",
    "CallExpression",
    "VariableDeclarator",
    "ConditionalExpression",
    "LogicalExpression"
  ];

  const containerTypesToInsertBraces = [
    "JSXAttribute"
  ];

  const surroundingBraces = containerTypesToInsertBraces.includes(node.parent.type);
  const multilineQuotes: LiteralValueQuotes[] = containerTypesToReplaceQuotes.includes(node.parent.type)
    ? ["'", "\"", "`"]
    : [];

  return {
    multilineQuotes,
    surroundingBraces
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

function findParentLiteralNodes(node: ESNode) {

  if(!hasESNodeParentExtension(node)){ return; }

  const parentLiterals: ESNode[] = [];
  let currentNode: ESNode = node;

  while(hasESNodeParentExtension(currentNode)){
    const parent = currentNode.parent;

    if(isESCallExpression(parent)){ break; }
    if(isESVariableDeclarator(parent)){ break; }

    if(parent.type === "TemplateLiteral"){
      for(const quasi of parent.quasis){
        if(quasi.range === node.range){
          break;
        }

        if(quasi.type === "TemplateElement"){
          parentLiterals.push(quasi);
        }
      }
    }

    if(
      parent.type === "TemplateElement" ||
      parent.type === "Literal"
    ){
      parentLiterals.push(parent);
    }

    currentNode = parent;

  }

  return parentLiterals;

}

function getParentClasses(ctx: Rule.RuleContext, literal: Literal, literals: Literal[]) {
  try {
    const esNode = ctx.sourceCode.getNodeByRangeIndex(literal.range[0]);
    const parentLiteralNodes = esNode && findParentLiteralNodes(esNode);
    const parentLiterals = parentLiteralNodes && getLiteralsFromParentLiteralNodes(parentLiteralNodes, literals);
    const parentClasses = parentLiterals ? getClassesFromLiteralNodes(parentLiterals) : [];

    return parentClasses;
  } catch {
    return [];
  }
}

function getLiteralsFromParentLiteralNodes(parentLiteralNodes: ESNode[], literals: Literal[]) {
  return parentLiteralNodes.map(parentLiteralNode => {
    return literals.find(literal => literal.range === parentLiteralNode.range);
  });
}

function getClassesFromLiteralNodes(literals: (Literal | undefined)[]) {
  return literals.reduce<string[]>((combinedClasses, literal) => {
    if(!literal){ return combinedClasses; }

    const classes = literal.content;
    const split = splitClasses(classes);

    for(const className of split){
      if(!combinedClasses.includes(className)){
        combinedClasses.push(className);
      }
    }

    return combinedClasses;

  }, []);
}

export function getESObjectPath(node: ESNode & Partial<Rule.NodeParentExtension>): string | undefined {

  if(!hasESNodeParentExtension(node)){ return; }

  if(
    node.type !== "Property" &&
    node.type !== "ObjectExpression" &&
    node.type !== "ArrayExpression" &&
    node.type !== "Identifier" &&
    node.type !== "Literal"
  ){
    return;
  }

  const paths: (string | undefined)[] = [];

  if(node.type === "Property"){
    if(node.key.type === "Identifier"){
      paths.unshift(createObjectPathElement(node.key.name));
    } else if(node.key.type === "Literal"){
      paths.unshift(createObjectPathElement(node.key.value?.toString() ?? node.key.raw));
    } else {
      return "";
    }
  }

  if(isESStringLike(node) && isInsideObjectValue(node)){
    const property = findMatchingParentNodes<ESNode>(node, [(node): node is ESNode => {
      return isESNode(node) && node.type === "Property";
    }])[0];

    return getESObjectPath(property);
  }

  if(isESObjectKey(node)){
    const property = node.parent;
    return getESObjectPath(property);
  }

  if(node.parent.type === "ArrayExpression" && node.type !== "Property"){
    const index = node.parent.elements.indexOf(node);
    paths.unshift(`[${index}]`);
  }

  paths.unshift(getESObjectPath(node.parent));

  return paths.reduce<string[]>((paths, currentPath) => {
    if(!currentPath){ return paths; }

    if(paths.length === 0){
      return [currentPath];
    }

    if(currentPath.startsWith("[") && currentPath.endsWith("]")){
      return [...paths, currentPath];
    }

    return [...paths, ".", currentPath];
  }, []).join("");

}

function createObjectPathElement(path?: string): string {
  if(!path){ return ""; }

  return path.match(/^[A-Z_a-z]\w*$/)
    ? path
    : `["${path}"]`;
}

export interface ESSimpleStringLiteral extends Rule.NodeParentExtension, ESSimpleLiteral {
  value: string;
}

export function isESObjectKey(node: ESBaseNode & Rule.NodeParentExtension) {
  return (
    node.parent.type === "Property" &&
    node.parent.parent.type === "ObjectExpression" &&
    node.parent.key === node
  );
}

export function isInsideObjectValue(node: ESBaseNode & Partial<Rule.NodeParentExtension>) {
  if(!hasESNodeParentExtension(node)){ return false; }

  // Allow call expressions as object values
  if(isESCallExpression(node)){ return false; }

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

function isTaggedTemplateExpression(node: ESBaseNode): node is ESTaggedTemplateExpression {
  return node.type === "TaggedTemplateExpression";
}

function isTaggedTemplateSymbol(node: ESBaseNode & Partial<Rule.NodeParentExtension>): node is ESIdentifier {
  return node.type === "Identifier" && !!node.parent && isTaggedTemplateExpression(node.parent);
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

function getESMatcherFunctions(matchers: Matcher[]): MatcherFunctions<ESNode> {
  return matchers.reduce<MatcherFunctions<ESNode>>((matcherFunctions, matcher) => {
    switch (matcher.match){
      case MatcherType.String: {
        matcherFunctions.push((node): node is ESNode => {

          if(!isESNode(node)){ return false; }

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
        matcherFunctions.push((node): node is ESNode => {

          if(!isESNode(node)){ return false; }

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }

          if(!hasESNodeParentExtension(node)){ return false; }
          if(!isESObjectKey(node)){ return false; }

          const path = getESObjectPath(node);

          return path && matcher.pathPattern ? matchesPathPattern(path, matcher.pathPattern) : true;
        });
        break;
      }
      case MatcherType.ObjectValue: {
        matcherFunctions.push((node): node is ESNode => {

          if(!isESNode(node)){ return false; }

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }
          if(!hasESNodeParentExtension(node)){ return false; }
          if(isESObjectKey(node)){ return false; }

          if(!isInsideObjectValue(node)){ return false; }
          if(!isESStringLike(node)){ return false; }

          const path = getESObjectPath(node);

          return path && matcher.pathPattern ? matchesPathPattern(path, matcher.pathPattern) : true;
        });
        break;
      }
    }
    return matcherFunctions;
  }, []);
}
