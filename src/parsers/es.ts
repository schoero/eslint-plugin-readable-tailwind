import { MATCHER_RESULT, MatcherType } from "better-tailwindcss:types/rule.js";
import {
  getLiteralNodesByMatchers,
  isIndexedAccessLiteral,
  isInsideConditionalExpressionTest,
  isInsideDisallowedBinaryExpression,
  isInsideLogicalExpressionLeft,
  isInsideMemberExpression,
  matchesPathPattern
} from "better-tailwindcss:utils/matchers.js";
import {
  createObjectPathElement,
  deduplicateLiterals,
  getContent,
  getIndentation,
  getQuotes,
  getWhitespace,
  isGenericNodeWithParent,
  matchesName
} from "better-tailwindcss:utils/utils.js";
import { createVisitedNodes, visitNode } from "better-tailwindcss:utils/visitedNodes.js";

import type { Rule } from "eslint";
import type {
  ArrowFunctionExpression as ESArrowFunctionExpression,
  BaseNode as ESBaseNode,
  BinaryExpression as ESBinaryExpression,
  CallExpression as ESCallExpression,
  ConditionalExpression as ESConditionalExpression,
  ExportDefaultDeclaration as ESExportDefaultDeclaration,
  Expression as ESExpression,
  FunctionDeclaration as ESFunctionDeclaration,
  FunctionExpression as ESFunctionExpression,
  Identifier as ESIdentifier,
  LogicalExpression as ESLogicalExpression,
  MemberExpression as ESMemberExpression,
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
} from "better-tailwindcss:types/ast.js";
import type { WithParent } from "better-tailwindcss:types/estree.js";
import type {
  ArgumentTarget,
  CalleeSelector,
  CallTarget,
  MatcherFunctions,
  SelectorMatcher,
  TagSelector,
  VariableSelector
} from "better-tailwindcss:types/rule.js";
import type { GenericNodeWithParent } from "better-tailwindcss:utils/utils.js";


export const ES_CONTAINER_TYPES_TO_REPLACE_QUOTES: string[] = [
  "ArrayExpression",
  "Property",
  "CallExpression",
  "VariableDeclarator",
  "ConditionalExpression",
  "LogicalExpression"
];

export const ES_CONTAINER_TYPES_TO_INSERT_BRACES: string[] = [
];


export function getLiteralsByESVariableDeclarator(ctx: Rule.RuleContext, node: ESVariableDeclarator, selectors: VariableSelector[]): Literal[] {

  const literals = selectors.reduce<Literal[]>((literals, selector) => {

    if(!node.init){ return literals; }
    if(!isESVariableSymbol(node.id)){ return literals; }
    if(!matchesName(selector.name, node.id.name)){ return literals; }

    if(!selector.match){
      literals.push(...getLiteralsByESExpression(ctx, [node.init]));
      return literals;
    }

    if(isESCallExpression(node.init)){
      return literals;
    }

    literals.push(...getLiteralsByESMatchers(ctx, node.init, selector.match));

    return literals;
  }, []);

  return literals.filter(deduplicateLiterals);

}

export function getLiteralsByESExportDefaultDeclaration(ctx: Rule.RuleContext, node: ESExportDefaultDeclaration, selectors: VariableSelector[]): Literal[] {

  const literals = selectors.reduce<Literal[]>((literals, selector) => {

    if(!matchesName(selector.name, "default")){ return literals; }
    if(!isESExportDefaultExpression(node.declaration)){ return literals; }

    if(!selector.match){
      literals.push(...getLiteralsByESExpression(ctx, [node.declaration]));
      return literals;
    }

    if(isESCallExpression(node.declaration)){
      return literals;
    }

    literals.push(...getLiteralsByESMatchers(ctx, node.declaration, selector.match));

    return literals;
  }, []);

  return literals.filter(deduplicateLiterals);

}

export function getLiteralsByESCallExpression(ctx: Rule.RuleContext, node: ESCallExpression, selectors: CalleeSelector[]): Literal[] {

  if(isNestedCurriedCall(node)){
    return [];
  }

  const callChain = getCurriedCallChain(node);

  if(!callChain){ return []; }

  const calleePath = getESCalleeName(callChain[0].callee, "path");
  const calleeName = getESCalleeName(callChain[0].callee, "name");

  const literals = selectors.reduce<Literal[]>((literals, selector) => {

    if(
      !selector.path && !selector.name ||
      (!selector.path || !matchesName(selector.path, calleePath)) &&
      (!selector.name || !matchesName(selector.name, calleeName))
    ){
      return literals;
    }

    const targetCall = selector.targetCall ?? selector.callTarget;
    const targetCalls = getTargetCalls(callChain, targetCall);

    for(const targetCall of targetCalls){
      const targetArguments = getTargetArguments(targetCall.arguments, selector.targetArgument);

      if(!selector.match){
        literals.push(...getLiteralsByESExpression(ctx, targetArguments));
        continue;
      }

      for(const targetArgument of targetArguments){
        literals.push(...getLiteralsByESMatchers(ctx, targetArgument, selector.match));
      }
    }

    return literals;
  }, []);

  return literals.filter(deduplicateLiterals);

}

export function getLiteralsByTaggedTemplateExpression(ctx: Rule.RuleContext, node: ESTaggedTemplateExpression, selectors: TagSelector[]): Literal[] {
  const tagPath = getTaggedTemplateName(node.tag, "path");
  const tagName = getTaggedTemplateName(node.tag, "name");

  if(!tagPath && !tagName){ return []; }

  const literals = selectors.reduce<Literal[]>((literals, selector) => {

    if(
      !selector.path && !selector.name ||
      (!selector.path || !matchesName(selector.path, tagPath)) &&
      (!selector.name || !matchesName(selector.name, tagName))
    ){
      return literals;
    }

    if(!selector.match){
      literals.push(...getLiteralsByESTemplateLiteral(ctx, node.quasi));
      return literals;
    }

    literals.push(...getLiteralsByESMatchers(ctx, node, selector.match));

    return literals;
  }, []);

  return literals.filter(deduplicateLiterals);

}

export function getLiteralsByESBareTemplateLiteral(ctx: Rule.RuleContext, node: ESTemplateLiteral, selectors: TagSelector[]): Literal[] {
  const leadingComment = getLeadingComment(ctx, node);

  if(isTaggedTemplateLiteral(node) || !leadingComment){ return [];}

  const literals = selectors.reduce<Literal[]>((literals, selector) => {
    if(!selector.name || !matchesName(selector.name, leadingComment)){ return literals; }

    if(!selector.match){
      literals.push(...getLiteralsByESTemplateLiteral(ctx, node));
      return literals;
    }

    literals.push(...getLiteralsByESMatchers(ctx, node, selector.match));

    return literals;
  }, []);

  return literals.filter(deduplicateLiterals);
}

export function getLiteralsByESLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {
  if(isESTemplateLiteral(node)){
    return getLiteralsByESTemplateLiteral(ctx, node);
  }
  const literal = getLiteralByESLiteralNode(ctx, node);
  return literal ? [literal] : [];
}

export function getLiteralByESLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal | undefined {
  if(isESSimpleStringLiteral(node)){
    return getStringLiteralByESStringLiteral(ctx, node);
  }
  if(isESTemplateElement(node) && hasESNodeParentExtension(node)){
    return getLiteralByESTemplateElement(ctx, node);
  }
}

function getLiteralByESLiteralNodeInternal(ctx: Rule.RuleContext, node: ESBaseNode, visitedNodes: Set<ESNode>): Literal | undefined {
  if(isESSimpleStringLiteral(node)){
    return getStringLiteralByESStringLiteralInternal(ctx, node, visitedNodes);
  }
  if(isESTemplateElement(node) && hasESNodeParentExtension(node)){
    return getLiteralByESTemplateElementInternal(ctx, node, visitedNodes);
  }
}

export function getLiteralsByESMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: SelectorMatcher[]): Literal[] {
  const matcherFunctions = getESMatcherFunctions(matchers);
  const literalNodes = getLiteralNodesByMatchers<ESBaseNode>(ctx, node, matcherFunctions);
  const literals = literalNodes.flatMap(literalNode => getLiteralsByESLiteralNode(ctx, literalNode));
  return literals.filter(deduplicateLiterals);
}

export function getStringLiteralByESStringLiteral(ctx: Rule.RuleContext, node: ESSimpleStringLiteral): StringLiteral | undefined {
  return getStringLiteralByESStringLiteralInternal(ctx, node, createVisitedNodes());
}

function getStringLiteralByESStringLiteralInternal(ctx: Rule.RuleContext, node: ESSimpleStringLiteral, visitedNodes: Set<ESNode>): StringLiteral | undefined {

  const raw = node.raw;

  if(!raw || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const line = ctx.sourceCode.lines[node.loc.start.line - 1];

  const quotes = getQuotes(raw);
  const priorLiterals = findPriorLiterals(ctx, node, visitedNodes);
  const content = getContent(raw, quotes);
  const whitespaces = getWhitespace(content);
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);
  const supportsMultiline = !isESObjectKey(node);
  const concatenation = getStringConcatenationMeta(ctx, node, visitedNodes);

  return {
    ...quotes,
    ...whitespaces,
    ...multilineQuotes,
    ...concatenation,
    content,
    indentation,
    isInterpolated: false,
    loc: node.loc,
    priorLiterals,
    range: node.range,
    raw,
    supportsMultiline,
    type: "StringLiteral"
  };

}

function getLiteralByESTemplateElement(ctx: Rule.RuleContext, node: ESTemplateElement & Rule.Node): TemplateLiteral | undefined {
  return getLiteralByESTemplateElementInternal(ctx, node, createVisitedNodes());
}

function getLiteralByESTemplateElementInternal(ctx: Rule.RuleContext, node: ESTemplateElement & Rule.Node, visitedNodes: Set<ESNode>): TemplateLiteral | undefined {

  const raw = ctx.sourceCode.getText(node);

  if(!raw || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const line = ctx.sourceCode.lines[node.parent.loc.start.line - 1];

  const quotes = getQuotes(raw);
  const braces = getBracesByString(ctx, raw);
  const isInterpolated = getIsInterpolated(ctx, raw);
  const priorLiterals = findPriorLiterals(ctx, node, visitedNodes);
  const content = getContent(raw, quotes, braces);
  const whitespaces = getWhitespace(content);
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);
  const concatenation = getStringConcatenationMeta(ctx, node, visitedNodes);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    ...multilineQuotes,
    ...concatenation,
    content,
    indentation,
    isInterpolated,
    loc: node.loc,
    priorLiterals,
    range: node.range,
    raw,
    supportsMultiline: true,
    type: "TemplateLiteral"
  };

}

function getMultilineQuotes(node: ESNode & Rule.NodeParentExtension): MultilineMeta {
  const surroundingBraces = ES_CONTAINER_TYPES_TO_INSERT_BRACES.includes(node.parent.type);
  const multilineQuotes: LiteralValueQuotes[] = ES_CONTAINER_TYPES_TO_REPLACE_QUOTES.includes(node.parent.type)
    ? ["`"]
    : [];

  return {
    multilineQuotes,
    surroundingBraces
  };
}

function getLiteralsByESExpression(ctx: Rule.RuleContext, args: ESExpression[]): Literal[] {
  return args.reduce<Literal[]>((acc, node) => {
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

export function findParentESTemplateLiteralByESTemplateElement(node: WithParent<ESNode>): ESTemplateLiteral | undefined {
  if(!hasESNodeParentExtension(node)){ return; }
  if(node.parent.type === "TemplateLiteral"){ return node.parent; }
  return findParentESTemplateLiteralByESTemplateElement(node.parent);
}

function findPriorLiterals(ctx: Rule.RuleContext, node: ESNode, visitedNodes?: Set<ESNode>) {

  if(!hasESNodeParentExtension(node)){ return; }

  const priorLiterals: Literal[] = [];
  let currentNode: ESNode = node;

  const visited = createVisitedNodes(visitedNodes);

  while(hasESNodeParentExtension(currentNode)){
    const parent = currentNode.parent;

    if(isESCallExpression(parent)){ break; }
    if(isESArrowFunctionExpression(parent)){ break; }
    if(isESFunctionExpression(parent)){ break; }
    if(isESVariableDeclarator(parent)){ break; }

    if(parent.type === "TemplateLiteral"){
      for(const quasi of parent.quasis){
        if(quasi.range === node.range){
          break;
        }

        if(quasi.type === "TemplateElement" && hasESNodeParentExtension(quasi) && visitNode(visited, quasi)){
          const literal = getLiteralByESTemplateElementInternal(ctx, quasi, visited);

          if(!literal){
            continue;
          }

          priorLiterals.push(literal);
        }
      }
    }

    if(parent.type === "TemplateElement" && visitNode(visited, parent)){
      const literal = getLiteralByESTemplateElementInternal(ctx, parent, visited);

      if(!literal){
        continue;
      }

      priorLiterals.push(literal);
    }

    if(parent.type === "Literal"){
      const literals = getLiteralsByESLiteralNode(ctx, parent);

      if(!literals){
        continue;
      }

      priorLiterals.push(...literals);
    }

    currentNode = parent;

  }

  return priorLiterals;

}

export function getESObjectPath(node: WithParent<ESNode>): string | undefined {

  if(!isGenericNodeWithParent(node)){ return; }
  if(!hasESNodeParentExtension(node)){ return; }

  if(
    node.type !== "Property" &&
    node.type !== "ObjectExpression" &&
    node.type !== "ArrayExpression" &&
    node.type !== "Identifier" &&
    node.type !== "Literal" &&
    node.type !== "TemplateElement"
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
    const property = findMatchingParentNodes<ESNode>(node, (node): node is ESNode => {
      return isESNode(node) && node.type === "Property";
    });

    if(property){
      return getESObjectPath(property);
    }
  }

  if(isESObjectKey(node)){
    const property = node.parent;
    return getESObjectPath(property);
  }

  if(node.parent.type === "ArrayExpression" && node.type !== "Property" && node.type !== "TemplateElement"){
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

export function isInsideObjectValue(node: WithParent<ESNode>) {
  if(!hasESNodeParentExtension(node)){ return false; }

  // #34 allow call expressions as object values
  if(isESCallExpression(node)){ return false; }
  if(isESArrowFunctionExpression(node)){ return false; }
  if(isESFunctionExpression(node)){ return false; }

  if(
    node.parent.type === "Property" &&
    node.parent.parent.type === "ObjectExpression" &&
    node.parent.value === node
  ){
    return true;
  }

  return isInsideObjectValue(node.parent);
}


function findMatchingParentNodes<Node>(node: Partial<GenericNodeWithParent>, matchesNode: (node: unknown) => node is Node): Node | undefined {
  if(!isGenericNodeWithParent(node)){ return; }

  if(matchesNode(node.parent)){
    return node.parent;
  }

  return findMatchingParentNodes(node.parent, matchesNode);
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

export function isESBinaryExpression(node: ESBaseNode): node is ESBinaryExpression {
  return node.type === "BinaryExpression";
}

export function isESConditionalExpression(node: ESBaseNode): node is ESConditionalExpression {
  return node.type === "ConditionalExpression";
}

export function isESLogicalExpression(node: ESBaseNode): node is ESLogicalExpression {
  return node.type === "LogicalExpression";
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

export function isESArrowFunctionExpression(node: ESBaseNode): node is ESArrowFunctionExpression {
  return node.type === "ArrowFunctionExpression";
}

export function isESFunctionExpression(node: ESBaseNode): node is ESFunctionExpression {
  return node.type === "FunctionExpression";
}

export function isESFunctionDeclaration(node: ESBaseNode): node is ESFunctionDeclaration {
  return node.type === "FunctionDeclaration";
}

export function isESAnonymousFunction(node: ESBaseNode): boolean {
  if(isESArrowFunctionExpression(node)){
    return true;
  }

  if(isESFunctionExpression(node) && node.id === null){
    return true;
  }

  return false;
}

export function isESArrowFunctionWithoutBody(node: ESBaseNode): node is ESArrowFunctionExpression {
  return isESArrowFunctionExpression(node) && node.body.type !== "BlockStatement";
}

export function isESReturnStatement(node: ESNode): boolean {
  return node.type === "ReturnStatement";
}

function getESMemberExpressionPropertyName(node: ESMemberExpression): string | undefined {
  if(!node.computed && node.property.type === "Identifier"){
    return node.property.name;
  }

  if(node.computed && isESSimpleStringLiteral(node.property)){
    return node.property.value;
  }
}

function getESCalleeName(node: ESBaseNode, type: "name" | "path"): string | undefined {
  if(node.type === "Identifier" && "name" in node && typeof node.name === "string"){
    return node.name;
  }

  if(node.type === "MemberExpression" && "object" in node){
    const memberNode = node as ESMemberExpression;

    if(memberNode.object.type === "Super"){
      return;
    }

    const object = getESCalleeName(memberNode.object, type);
    const property = getESMemberExpressionPropertyName(memberNode);

    if(!property){
      return;
    }

    if(type === "name"){
      return property;
    }

    if(!object){
      return;
    }

    return `${object}.${property}`;
  }

  if(node.type === "ChainExpression" && "expression" in node){
    return getESCalleeName(node.expression as ESBaseNode, type);
  }
}

function getTaggedTemplateName(node: ESBaseNode & Partial<Rule.NodeParentExtension>, type: "name" | "path"): string | undefined {
  if(
    node.type === "Identifier" && "name" in node && typeof node.name === "string" &&
    hasESNodeParentExtension(node) &&
    isTaggedTemplateExpression(node.parent)
  ){
    return node.name;
  }
  if(node.type === "MemberExpression"){
    return getESCalleeName(node, type);
  }
  if(node.type === "CallExpression"){
    return getESCalleeName((node as ESCallExpression).callee, type);
  }
  if(node.type === "ChainExpression" && "expression" in node){
    return getTaggedTemplateName(node.expression as ESBaseNode, type);
  }
}

function isNestedCurriedCall(node: ESCallExpression): boolean {
  return hasESNodeParentExtension(node) && isESCallExpression(node.parent) && node.parent.callee === node;
}

function getCurriedCallChain(node: ESCallExpression) {
  const calls: ESCallExpression[] = [node];
  let currentCall: ESCallExpression = node;

  while(isESCallExpression(currentCall.callee)){
    currentCall = currentCall.callee;
    calls.unshift(currentCall);
  }

  return calls;
}

function getTargetCalls(callChain: ESCallExpression[], callTarget: CallTarget | undefined): ESCallExpression[] {
  return getTargetItems(callChain, callTarget, "first");
}

function getTargetArguments(args: (ESExpression | ESSpreadElement)[], argumentTarget: ArgumentTarget | undefined): ESExpression[] {
  const expressionArgs = args.map((arg): ESExpression => {
    return arg.type === "SpreadElement"
      ? arg.argument
      : arg;
  });

  if(typeof argumentTarget !== "number"){
    return getTargetItems(expressionArgs, argumentTarget, "all");
  }

  if(args.length === 0){
    return [];
  }

  const index = argumentTarget >= 0
    ? argumentTarget
    : args.length + argumentTarget;

  if(index < 0 || index >= args.length){
    return [];
  }

  const targetArg = args[index];

  return [targetArg.type === "SpreadElement" ? targetArg.argument : targetArg];
}

function getTargetItems<T>(items: T[], target: CallTarget | undefined, defaultTarget: "all" | "first"): T[] {
  if(items.length === 0){
    return [];
  }

  if(target === "all" || target === undefined && defaultTarget === "all"){
    return items;
  }

  if(target === "last"){
    return [items[items.length - 1]];
  }

  if(target === undefined || target === "first"){
    return [items[0]];
  }

  const index = target >= 0
    ? target
    : items.length + target;

  if(index < 0 || index >= items.length){
    return [];
  }

  return [items[index]];
}

function isTaggedTemplateExpression(node: ESBaseNode): node is ESTaggedTemplateExpression {
  return node.type === "TaggedTemplateExpression";
}

function isTaggedTemplateLiteral(node: ESBaseNode): node is ESTemplateLiteral {
  return hasESNodeParentExtension(node) && isTaggedTemplateExpression(node.parent);
}

export function isESVariableDeclarator(node: ESBaseNode): node is ESVariableDeclarator {
  return node.type === "VariableDeclarator";
}

function isESExportDefaultExpression(node: ESBaseNode): node is ESExpression {
  if(node.type === "FunctionDeclaration"){
    return false;
  }

  if(node.type === "ClassDeclaration"){
    return false;
  }

  return true;
}

function isESVariableSymbol(node: ESBaseNode & Partial<Rule.NodeParentExtension>): node is ESIdentifier {
  return node.type === "Identifier" && !!node.parent && isESVariableDeclarator(node.parent);
}

export function hasESNodeParentExtension(node: ESBaseNode): node is Rule.Node & Rule.NodeParentExtension {
  return "parent" in node && !!node.parent;
}

function getBracesByString(ctx: Rule.RuleContext, raw: string): BracesMeta {
  const closingBraces = raw.trim().startsWith("}") ? "}" : undefined;
  const openingBraces = raw.trim().endsWith("${") ? "${" : undefined;

  return {
    closingBraces,
    openingBraces
  };
}

function getIsInterpolated(ctx: Rule.RuleContext, raw: string): boolean {
  const braces = getBracesByString(ctx, raw);
  return !!braces.closingBraces || !!braces.openingBraces;
}

function getLeadingComment(ctx: Rule.RuleContext, node: ESNode): string | undefined {
  try {
    const token = ctx.sourceCode.getTokenBefore(node, { includeComments: true });

    if(token && isESTokenComment(token)){
      return token.value.trim();
    }
  } catch {}
}

type ESTokenWithOptionalComment = {
  type: string;
  value?: string;
};

function isESTokenComment(token: ESTokenWithOptionalComment): token is ESTokenWithOptionalComment & { value: string; } {
  return (token.type === "Block" || token.type === "Line") && typeof token.value === "string";
}

function getStringConcatenationMeta(ctx: Rule.RuleContext, node: ESNode, visitedNodes?: Set<ESNode>): { isConcatenatedLeft: boolean; isConcatenatedRight: boolean; leftLiterals?: Literal[] | undefined; rightLiterals?: Literal[] | undefined; } {

  const { isConcatenatedLeft, isConcatenatedRight } = getStringConcatenationDirection(node);

  const visited = createVisitedNodes(visitedNodes);
  visitNode(visited, node);

  const leftNodes =
    findAdjacentInterpolatedExpressionNodes(node, "left") ??
    findAdjacentTemplateQuasiNodes(node, "left") ??
    findAdjacentPlusConcatenatedLiteralNodes(node, "left");

  const leftLiterals = isConcatenatedLeft
    ? buildConcatenationNeighborLiterals(ctx, leftNodes, visited)
    : undefined;

  const rightNodes =
    findAdjacentInterpolatedExpressionNodes(node, "right") ??
    findAdjacentTemplateQuasiNodes(node, "right") ??
    findAdjacentPlusConcatenatedLiteralNodes(node, "right");

  const rightLiterals = isConcatenatedRight
    ? buildConcatenationNeighborLiterals(ctx, rightNodes, visited)
    : undefined;

  return { isConcatenatedLeft, isConcatenatedRight, leftLiterals, rightLiterals };

}

function buildConcatenationNeighborLiterals(ctx: Rule.RuleContext, nodes: ESNode[] | undefined, visited: Set<ESNode>): Literal[] | undefined {
  if(!nodes){ return; }

  return nodes
    .filter(adjacentNode => visitNode(visited, adjacentNode))
    .map(adjacentNode => getLiteralByESLiteralNodeInternal(ctx, adjacentNode, visited))
    .filter((literal): literal is Literal => literal !== undefined);
}

export function getStringConcatenationDirection(node: ESNode, isConcatenatedLeft = false, isConcatenatedRight = false): { isConcatenatedLeft: boolean; isConcatenatedRight: boolean; } {
  if(!hasESNodeParentExtension(node)){
    return {
      isConcatenatedLeft,
      isConcatenatedRight
    };
  }

  const parent = node.parent;

  if(
    isESCallExpression(parent) ||
    isESArrowFunctionExpression(parent) ||
    isESFunctionExpression(parent) ||
    isESVariableDeclarator(parent)
  ){
    return {
      isConcatenatedLeft,
      isConcatenatedRight
    };
  }

  if(isESTemplateLiteral(node.parent) && !isESTemplateElement(node)){
    return {
      isConcatenatedLeft: true,
      isConcatenatedRight: true
    };
  }

  // a template quasi is concatenated with the interpolation adjacent to it (`}` before, `${` after)
  if(isESTemplateElement(node) && isESTemplateLiteral(parent)){
    const index = parent.quasis.indexOf(node);
    return getStringConcatenationDirection(
      parent,
      isConcatenatedLeft || index > 0,
      isConcatenatedRight || index < parent.quasis.length - 1
    );
  }

  if(isESBinaryExpression(parent) && parent.operator === "+"){
    return getStringConcatenationDirection(
      parent,
      isConcatenatedLeft || parent.right === node,
      isConcatenatedRight || parent.left === node
    );
  }

  return getStringConcatenationDirection(parent, isConcatenatedLeft, isConcatenatedRight);
}

// resolves the literal nodes adjacent to `node` on the given side of a `+` concatenation chain
function findAdjacentPlusConcatenatedLiteralNodes(node: ESNode, direction: "left" | "right"): ESNode[] | undefined {
  const sibling = findConcatenationCounterpart(node, direction);
  if(!sibling){ return; }
  const leafNodes = findConcatenationLeafNodes(sibling, direction === "left" ? "right" : "left");
  return leafNodes.length > 0 ? leafNodes : undefined;
}

// resolves the leaf literal nodes of the interpolation expression adjacent to a template element (through conditional branches)
function findAdjacentInterpolatedExpressionNodes(node: ESNode, direction: "left" | "right"): ESNode[] | undefined {
  if(!isESTemplateElement(node) || !hasESNodeParentExtension(node) || !isESTemplateLiteral(node.parent)){
    return;
  }

  const parent = node.parent;
  const index = parent.quasis.indexOf(node);
  if(index === -1){ return; }

  const expression = direction === "left" ? parent.expressions[index - 1] : parent.expressions[index];
  if(!expression){ return; }

  const leafNodes = findConcatenationLeafNodes(expression, direction);
  return leafNodes.length > 0 ? leafNodes : undefined;
}

// resolves the template quasis directly adjacent to an interpolation expression (through conditional branches)
function findAdjacentTemplateQuasiNodes(node: ESNode, direction: "left" | "right"): ESNode[] | undefined {
  let current: ESNode = node;

  while(hasESNodeParentExtension(current)){
    const parent = current.parent;

    if(isESTemplateLiteral(parent)){
      if(isESTemplateElement(current)){
        current = parent;
        continue;
      }

      const index = parent.expressions.indexOf(current as ESExpression);
      if(index === -1){ return; }

      const quasi = direction === "left" ? parent.quasis[index] : parent.quasis[index + 1];
      return quasi ? [quasi] : undefined;
    }

    if(isESConditionalExpression(parent) && (parent.consequent === current || parent.alternate === current)){
      current = parent;
      continue;
    }

    if(
      isESLogicalExpression(parent) &&
      parent.right === current &&
      (
        parent.operator === "&&" ||
        parent.operator === "||" ||
        parent.operator === "??"
      )
    ){
      current = parent;
      continue;
    }

    break;
  }
}

function findConcatenationCounterpart(node: ESNode, direction: "left" | "right"): ESNode | undefined {
  let current: ESNode = node;

  while(hasESNodeParentExtension(current)){
    const parent = current.parent;

    if(isESCallExpression(parent)){ break; }
    if(isESArrowFunctionExpression(parent)){ break; }
    if(isESFunctionExpression(parent)){ break; }
    if(isESVariableDeclarator(parent)){ break; }

    // conditionals are transparent: an operand's neighbor lives outside the branch
    if(isESConditionalExpression(parent) && (parent.consequent === current || parent.alternate === current)){
      current = parent;
      continue;
    }

    // an edge quasi's `+` neighbor lives outside the template literal
    if(isESTemplateLiteral(parent)){
      const quasis = parent.quasis;
      const isEdge = direction === "left"
        ? quasis[0] === current
        : quasis[quasis.length - 1] === current;

      if(isEdge){
        current = parent;
        continue;
      }

      break;
    }

    if(isESBinaryExpression(parent) && parent.operator === "+"){
      if(direction === "left" && parent.right === current){ return parent.left; }
      if(direction === "right" && parent.left === current){ return parent.right; }
      current = parent;
      continue;
    }

    if(isESLogicalExpression(parent) && parent.operator === "&&" && parent.right === current){
      current = parent;
      continue;
    }

    break;
  }
}

function findConcatenationLeafNodes(node: ESNode, edge: "left" | "right"): ESNode[] {
  if(isESSimpleStringLiteral(node)){
    return [node];
  }

  if(isESTemplateLiteral(node)){
    const quasis = node.quasis;
    const edgeQuasi = edge === "left" ? quasis[0] : quasis[quasis.length - 1];
    return edgeQuasi ? [edgeQuasi] : [];
  }

  if(isESBinaryExpression(node) && node.operator === "+"){
    return findConcatenationLeafNodes(edge === "left" ? node.left : node.right, edge);
  }

  if(isESConditionalExpression(node)){
    return [
      ...findConcatenationLeafNodes(node.consequent, edge),
      ...findConcatenationLeafNodes(node.alternate, edge)
    ];
  }

  if(
    isESLogicalExpression(node) &&
    (
      node.operator === "&&" ||
      node.operator === "||" ||
      node.operator === "??"
    )
  ){
    return findConcatenationLeafNodes(node.right, "left");
  }

  return [];
}

export function getESMatcherFunctions(
  matchers: SelectorMatcher[],
  options?: {
    isStringLikeNode?: (node: ESBaseNode) => boolean;
  }
): MatcherFunctions {
  return matchers.reduce<MatcherFunctions>((matcherFunctions, matcher) => {
    switch (matcher.type){
      case MatcherType.AnonymousFunctionReturn: {

        matcherFunctions.push(node => {

          if(isESNode(node) && (
            isESCallExpression(node) ||
            isESVariableDeclarator(node)
          )){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isESNode(node) ||
            !hasESNodeParentExtension(node) ||
            !isESAnonymousFunction(node)
          ){
            return MATCHER_RESULT.NO_MATCH;
          }

          // return matchers directly if the arrow function immediately returns
          if(isESArrowFunctionWithoutBody(node)){
            return [(node: unknown) => {
              if(
                !isESNode(node) ||
                !hasESNodeParentExtension(node) ||
                !isESArrowFunctionWithoutBody(node.parent) ||
                node !== node.parent.body){
                return MATCHER_RESULT.NO_MATCH;
              }

              return getESMatcherFunctions(matcher.match, options);
            }];
          }

          // create a matcher function that first matches the return statement and then the final matchers
          return [(node: unknown) => {
            if(isESNode(node) && (
              isESCallExpression(node) ||
              isESArrowFunctionExpression(node) ||
              isESVariableDeclarator(node) ||
              isESFunctionExpression(node) ||
              isESFunctionDeclaration(node)
            )){
              return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
            }

            if(
              !isESNode(node) ||
              !hasESNodeParentExtension(node) ||

              !isESReturnStatement(node)
            ){
              return MATCHER_RESULT.NO_MATCH;
            }

            return getESMatcherFunctions(matcher.match, options);
          }];

        });
        break;
      }
      case MatcherType.String: {
        matcherFunctions.push(node => {

          if(isESNode(node) && (
            isESCallExpression(node) ||
            isESArrowFunctionExpression(node) ||
            isESVariableDeclarator(node) ||
            isESFunctionExpression(node)
          )){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isESNode(node) ||
            !hasESNodeParentExtension(node) ||

            isInsideDisallowedBinaryExpression(node) ||
            isInsideConditionalExpressionTest(node) ||
            isInsideLogicalExpressionLeft(node) ||
            isIndexedAccessLiteral(node) ||

            isESObjectKey(node) ||
            isInsideObjectValue(node)){
            return MATCHER_RESULT.NO_MATCH;
          }

          return isESStringLike(node) || !!options?.isStringLikeNode?.(node);
        });
        break;
      }
      case MatcherType.ObjectKey: {
        matcherFunctions.push(node => {

          if(isESNode(node) && (
            isESCallExpression(node) ||
            isESArrowFunctionExpression(node) ||
            isESVariableDeclarator(node) ||
            isESFunctionExpression(node)
          )){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isESNode(node) ||
            !hasESNodeParentExtension(node) ||
            !isESObjectKey(node) ||

            isInsideDisallowedBinaryExpression(node) ||
            isInsideConditionalExpressionTest(node) ||
            isInsideLogicalExpressionLeft(node) ||
            isInsideMemberExpression(node) ||
            isIndexedAccessLiteral(node)){
            return MATCHER_RESULT.NO_MATCH;
          }

          const path = getESObjectPath(node);

          if(!path || !matcher.path){
            return MATCHER_RESULT.MATCH;
          }

          return matchesPathPattern(path, matcher.path);
        });
        break;
      }
      case MatcherType.ObjectValue: {
        matcherFunctions.push(node => {

          if(isESNode(node) && (
            isESCallExpression(node) ||
            isESArrowFunctionExpression(node) ||
            isESVariableDeclarator(node) ||
            isESFunctionExpression(node)
          )){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isESNode(node) ||
            !hasESNodeParentExtension(node) ||
            !isInsideObjectValue(node) ||

            isInsideDisallowedBinaryExpression(node) ||
            isInsideConditionalExpressionTest(node) ||
            isInsideLogicalExpressionLeft(node) ||
            isESObjectKey(node) ||
            isIndexedAccessLiteral(node) ||

            !isESStringLike(node) && !options?.isStringLikeNode?.(node)){
            return MATCHER_RESULT.NO_MATCH;
          }

          const path = getESObjectPath(node);

          if(!path || !matcher.path){
            return MATCHER_RESULT.MATCH;
          }

          return matchesPathPattern(path, matcher.path);
        });
        break;
      }
    }
    return matcherFunctions;
  }, []);
}
