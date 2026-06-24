import { hasESNodeParentExtension, isESSimpleStringLiteral } from "better-tailwindcss:parsers/es.js";
import { MATCHER_RESULT } from "better-tailwindcss:types/rule.js";
import { getCachedRegex } from "better-tailwindcss:utils/regex.js";
import { isGenericNodeWithParent } from "better-tailwindcss:utils/utils.js";

import type { Rule } from "eslint";
import type { Node as ESNode } from "estree";

import type { AttributeMatchers, AttributeName, Attributes } from "better-tailwindcss:options/schemas/attributes.js";
import type { CalleeMatchers, CalleeName, Callees } from "better-tailwindcss:options/schemas/callees.js";
import type { TagMatchers, TagName, Tags } from "better-tailwindcss:options/schemas/tags.js";
import type { VariableMatchers, VariableName, Variables } from "better-tailwindcss:options/schemas/variables.js";
import type { WithParent } from "better-tailwindcss:types/estree.js";
import type { MatcherFunctions } from "better-tailwindcss:types/rule.js";
import type { GenericNodeWithParent } from "better-tailwindcss:utils/utils.js";


export function getLiteralNodesByMatchers<Node>(ctx: Rule.RuleContext, node: unknown, matcherFunctions: MatcherFunctions): Node[] {
  if(!isGenericNodeWithParent(node)){ return []; }

  const self = matcherFunctions.reduce<Node[]>((self, matcherFunction) => {
    const result = matcherFunction(node);

    if(result === MATCHER_RESULT.NO_MATCH){
      return self;
    } else if(result === MATCHER_RESULT.MATCH){
      return [node as Node, ...self];
    }

    return self;
  }, []);

  const nestedMatcherFunctions = matcherFunctions.reduce<MatcherFunctions>((nestedMatcherFunctions, matcherFunction) => {
    const result = matcherFunction(node);

    if(result === MATCHER_RESULT.NO_MATCH || result === MATCHER_RESULT.MATCH){
      nestedMatcherFunctions.push(matcherFunction);
      return nestedMatcherFunctions;
    }

    if(result === MATCHER_RESULT.UNCROSSABLE_BOUNDARY){
      return nestedMatcherFunctions;
    }

    nestedMatcherFunctions.push(...result);
    return nestedMatcherFunctions;
  }, []);

  const nestedLiterals = findMatchingNestedNodes<Node>(node, nestedMatcherFunctions);

  return [...nestedLiterals, ...self];
}

function findMatchingNestedNodes<Node>(node: GenericNodeWithParent, matcherFunctions: MatcherFunctions) {
  if(matcherFunctions.length === 0){
    return [];
  }

  return Object.entries(node).reduce<Node[]>((matchedNodes, [key, value]) => {
    if(!value || typeof value !== "object" || key === "parent"){
      return matchedNodes;
    }

    let isMatch = false;
    let currentMatcherFunctions: MatcherFunctions = [...matcherFunctions];
    let hasMatcherFunctions = currentMatcherFunctions.length > 0;

    while(hasMatcherFunctions){
      const nextMatcherFunctions: MatcherFunctions = [];
      const nestedMatcherFunctions: MatcherFunctions = [];

      for(const matcherFunction of currentMatcherFunctions){
        const result = matcherFunction(value);

        if(result === MATCHER_RESULT.NO_MATCH){
          nextMatcherFunctions.push(matcherFunction);
          continue;
        }

        if(result === MATCHER_RESULT.MATCH){
          isMatch = true;
          nextMatcherFunctions.push(matcherFunction);
          continue;
        }

        if(result === MATCHER_RESULT.UNCROSSABLE_BOUNDARY){
          continue;
        }

        for(const nestedMatcherFunction of result){
          nestedMatcherFunctions.push(nestedMatcherFunction);
        }
      }

      hasMatcherFunctions = nestedMatcherFunctions.length > 0;
      currentMatcherFunctions = hasMatcherFunctions
        ? nestedMatcherFunctions
        : nextMatcherFunctions;
    }

    if(isMatch){
      matchedNodes.push(value as Node);
    }

    if(currentMatcherFunctions.length === 0){
      return matchedNodes;
    }

    matchedNodes.push(...findMatchingNestedNodes<Node>(value, currentMatcherFunctions));
    return matchedNodes;
  }, []);
}

export function matchesPathPattern(path: string, pattern: string): boolean {
  return getCachedRegex(pattern).test(path);
}

export function isCalleeName(callee: Callees[number]): callee is CalleeName {
  return typeof callee === "string";
}

export function isCalleeMatchers(callee: Callees[number]): callee is CalleeMatchers {
  return Array.isArray(callee) && typeof callee[0] === "string" && Array.isArray(callee[1]);
}

export function isVariableName(variable: Variables[number]): variable is VariableName {
  return typeof variable === "string";
}

export function isVariableMatchers(variable: Variables[number]): variable is VariableMatchers {
  return Array.isArray(variable) && typeof variable[0] === "string" && Array.isArray(variable[1]);
}

export function isTagName(tag: Tags[number]): tag is TagName {
  return typeof tag === "string";
}

export function isTagMatchers(tag: Tags[number]): tag is TagMatchers {
  return Array.isArray(tag) && typeof tag[0] === "string" && Array.isArray(tag[1]);
}

export function isAttributesName(attributes: Attributes[number]): attributes is AttributeName {
  return typeof attributes === "string";
}

export function isAttributesMatchers(attributes: Attributes[number]): attributes is AttributeMatchers {
  return Array.isArray(attributes) && typeof attributes[0] === "string" && Array.isArray(attributes[1]);
}

export function isInsideConditionalExpressionTest(node: WithParent<ESNode>): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent.type === "ConditionalExpression" && node.parent.test === node){ return true; }
  return isInsideConditionalExpressionTest(node.parent);
}

export function isInsideDisallowedBinaryExpression(node: WithParent<ESNode>): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(
    node.parent.type === "BinaryExpression" &&
    node.parent.operator !== "+" // allow string concatenation
  ){ return true; }
  return isInsideDisallowedBinaryExpression(node.parent);
}

export function isInsideLogicalExpressionLeft(node: WithParent<ESNode>): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent.type === "LogicalExpression" && node.parent.left === node){ return true; }
  return isInsideLogicalExpressionLeft(node.parent);
}

export function isInsideMemberExpression(node: WithParent<ESNode>): boolean {
  // aka indexed access: https://github.com/estree/estree/blob/master/es5.md#memberexpression
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent.type === "MemberExpression"){ return true; }
  return isInsideMemberExpression(node.parent);
}

export function isIndexedAccessLiteral(node: WithParent<ESNode>): boolean {
  if(!hasESNodeParentExtension(node)){ return false; }
  if(node.parent.type !== "MemberExpression"){ return false; }
  return node.parent.property === node && isESSimpleStringLiteral(node);
}
