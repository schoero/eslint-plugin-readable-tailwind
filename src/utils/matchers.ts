import {
  hasESNodeParentExtension,
  isESCallExpression,
  isESObjectKey,
  isESStringLike,
  isESVariableDeclarator,
  isInsideObjectValue
} from "readable-tailwind:parsers:es.js";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode, Node as ESNode, Program } from "estree";

import type {
  AttributeMatchers,
  AttributeName,
  AttributeRegex,
  Attributes,
  CalleeMatchers,
  CalleeName,
  CalleeRegex,
  Callees,
  MatcherFunctions,
  Regex,
  TagMatchers,
  TagName,
  TagRegex,
  Tags,
  VariableMatchers,
  VariableName,
  VariableRegex,
  Variables
} from "readable-tailwind:types:rule.js";


export function getLiteralNodesByMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matcherFunctions: MatcherFunctions): ESNode[] {

  if(!hasESNodeParentExtension(node)){ return []; }

  const nestedLiterals = findMatchingNestedNodes(node, matcherFunctions);
  const self = nodeMatches(node, matcherFunctions) ? [node] : [];

  return [...nestedLiterals, ...self];

}

export function findMatchingNestedNodes(node: ESNode | Program, matcherFunctions: MatcherFunctions): ESNode[] {
  return Object.entries(node).reduce<ESNode[]>((matchedNodes, [key, value]) => {
    if(!value || typeof value !== "object" || key === "parent"){
      return matchedNodes;
    }

    if(isESCallExpression(value)){ return matchedNodes; }
    if(isESVariableDeclarator(value)){ return matchedNodes; }

    if(nodeMatches(value, matcherFunctions)){
      matchedNodes.push(value);
    }

    matchedNodes.push(...findMatchingNestedNodes(value, matcherFunctions));
    return matchedNodes;
  }, []);
}

export function findMatchingParentNodes(node: ESNode & Partial<Rule.NodeParentExtension>, matcherFunctions: MatcherFunctions): ESNode[] {
  if(!hasESNodeParentExtension(node)){ return []; }

  if(nodeMatches(node.parent, matcherFunctions)){
    return [node.parent];
  }

  return findMatchingParentNodes(node.parent, matcherFunctions);
}

function nodeMatches(node: ESNode, matcherFunctions: MatcherFunctions): boolean {
  for(const matcherFunction of matcherFunctions){
    if(matcherFunction(node)){ return true; }
  }
  return false;
}

function isChildNodeOfNode(node: ESNode & Partial<Rule.NodeParentExtension>, parent: ESNode): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent === parent){ return true; }
  return isChildNodeOfNode(node.parent, parent);
}

export function getObjectPath(node: ESNode & Partial<Rule.NodeParentExtension>): string | undefined {

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
    const property = findMatchingParentNodes(node, [node => {
      return node.type === "Property";
    }])[0];

    return getObjectPath(property);
  }

  if(isESObjectKey(node)){
    const property = node.parent;
    return getObjectPath(property);
  }

  if(node.parent.type === "ArrayExpression" && node.type !== "Property"){
    const index = node.parent.elements.indexOf(node);
    paths.unshift(`[${index}]`);
  }

  paths.unshift(getObjectPath(node.parent));

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

export function matchesPathPattern(path: string, pattern: Regex): boolean {
  const regex = new RegExp(pattern);
  return regex.test(path);
}

export function isCalleeName(callee: Callees[number]): callee is CalleeName {
  return typeof callee === "string";
}

export function isCalleeRegex(callee: Callees[number]): callee is CalleeRegex {
  return Array.isArray(callee) && typeof callee[0] === "string" && typeof callee[1] === "string";
}

export function isCalleeMatchers(callee: Callees[number]): callee is CalleeMatchers {
  return Array.isArray(callee) && typeof callee[0] === "string" && Array.isArray(callee[1]);
}

export function isVariableName(variable: Variables[number]): variable is VariableName {
  return typeof variable === "string";
}

export function isVariableRegex(variable: Variables[number]): variable is VariableRegex {
  return Array.isArray(variable) && typeof variable[0] === "string" && typeof variable[1] === "string";
}

export function isVariableMatchers(variable: Variables[number]): variable is VariableMatchers {
  return Array.isArray(variable) && typeof variable[0] === "string" && Array.isArray(variable[1]);
}

export function isTagName(tag: Tags[number]): tag is TagName {
  return typeof tag === "string";
}

export function isTagRegex(tag: Tags[number]): tag is TagRegex {
  return Array.isArray(tag) && typeof tag[0] === "string" && typeof tag[1] === "string";
}

export function isTagMatchers(tag: Tags[number]): tag is TagMatchers {
  return Array.isArray(tag) && typeof tag[0] === "string" && Array.isArray(tag[1]);
}

export function isAttributesName(Attributes: Attributes[number]): Attributes is AttributeName {
  return typeof Attributes === "string";
}

export function isAttributesRegex(Attributes: Attributes[number]): Attributes is AttributeRegex {
  return Array.isArray(Attributes) && typeof Attributes[0] === "string" && typeof Attributes[1] === "string";
}

export function isAttributesMatchers(Attributes: Attributes[number]): Attributes is AttributeMatchers {
  return Array.isArray(Attributes) && typeof Attributes[0] === "string" && Array.isArray(Attributes[1]);
}

export function isInsideConditionalExpressionTest(node: ESNode & Partial<Rule.NodeParentExtension>): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent.type === "ConditionalExpression" && node.parent.test === node){ return true; }
  return isInsideConditionalExpressionTest(node.parent);
}

export function isInsideLogicalExpressionLeft(node: ESNode & Partial<Rule.NodeParentExtension>): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent.type === "LogicalExpression" && node.parent.left === node){ return true; }
  return isInsideLogicalExpressionLeft(node.parent);
}
