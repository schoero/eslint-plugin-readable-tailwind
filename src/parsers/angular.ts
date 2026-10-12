import { MATCHER_RESULT, MatcherType } from "better-tailwindcss:types/rule.js";
import { getLocByRange } from "better-tailwindcss:utils/ast.js";
import { getLiteralNodesByMatchers, matchesPathPattern } from "better-tailwindcss:utils/matchers.js";
import {
  addAttribute,
  createObjectPathElement,
  deduplicateLiterals,
  getIndentation,
  getQuotes,
  getWhitespace,
  matchesName
} from "better-tailwindcss:utils/utils.js";
import { createVisitedNodes, visitNode } from "better-tailwindcss:utils/visitedNodes.js";

import type {
  AST,
  ASTWithSource,
  Binary,
  Call,
  Conditional,
  Interpolation,
  LiteralArray,
  LiteralMap,
  LiteralMapPropertyKey,
  LiteralPrimitive,
  ParenthesizedExpression,
  ParseSourceSpan,
  TemplateLiteral,
  TemplateLiteralElement,
  TmplAstBoundAttribute,
  TmplAstElement,
  TmplAstNode,
  TmplAstTextAttribute
} from "@angular/compiler";
import type { Rule } from "eslint";
import type { SourceLocation } from "estree";

import type { BracesMeta, ConcatenationMeta, Literal } from "better-tailwindcss:types/ast.js";
import type { AttributeSelector, MatcherFunctions, SelectorMatcher } from "better-tailwindcss:types/rule.js";

// https://angular.dev/api/common/NgClass
// https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings

export function getAttributesByAngularElement(ctx: Rule.RuleContext, node: TmplAstElement): (TmplAstBoundAttribute | TmplAstTextAttribute)[] {
  return [
    ...node.attributes,
    ...node.inputs
  ];
}

export function getLiteralsByAngularAttribute(ctx: Rule.RuleContext, attribute: TmplAstBoundAttribute | TmplAstTextAttribute, selectors: AttributeSelector[]): Literal[] {

  const name = getAttributeName(attribute);

  const literals = selectors.reduce<Literal[]>((literals, selector) => {
    if(!matchesName(selector.name.toLowerCase(), name.toLowerCase())){ return literals; }

    if(!selector.match){
      literals.push(...createLiteralsByAngularAttribute(ctx, attribute));
      return literals;
    }

    if(isTextAttribute(attribute) && selector.match.some(matcher => matcher.type === MatcherType.String)){
      literals.push(...createLiteralsByAngularTextAttribute(ctx, attribute));
    }
    if(isBoundAttribute(attribute)){
      if(isBoundAttributeName(attribute)){
        literals.push(...getLiteralsByAngularMatchers(ctx, attribute, selector.match));
      } else if(isASTWithSource(attribute.value)){
        literals.push(...getLiteralsByAngularMatchers(ctx, attribute.value.ast, selector.match));
      }
    }

    return literals;
  }, []);

  return literals
    .filter(deduplicateLiterals)
    .map(addAttribute(name));
}

function createLiteralsByAngularAst(ctx: Rule.RuleContext, ast: AST): Literal[] {
  if(isInterpolation(ast)){
    return ast.expressions.flatMap(expression => {
      return createLiteralsByAngularAst(ctx, expression);
    });
  }

  if(isLiteralArray(ast)){
    return ast.expressions.flatMap(expression => {
      return createLiteralsByAngularAst(ctx, expression);
    });
  }

  if(isObjectKey(ast)){
    return createLiteralByLiteralMapKey(ctx, ast);
  }

  if(isConditional(ast)){
    return createLiteralsByAngularConditional(ctx, ast);
  }

  if(isLiteralPrimitive(ast)){
    return createLiteralByAngularLiteralPrimitive(ctx, ast);
  }

  if(isTemplateLiteralElement(ast)){
    return createLiteralByAngularTemplateLiteralElement(ctx, ast);
  }

  if(isBoundAttribute(ast) && isBoundAttributeName(ast)){
    return createLiteralsByAngularBoundAttributeName(ctx, ast);
  }
  return [];

}

function createLiteralsByAngularConditional(ctx: Rule.RuleContext, conditional: Conditional): Literal[] {
  const literals: Literal[] = [];

  literals.push(...createLiteralsByAngularAst(ctx, conditional.trueExp));
  literals.push(...createLiteralsByAngularAst(ctx, conditional.falseExp));

  return literals;
}

function createLiteralsByAngularAttribute(ctx: Rule.RuleContext, attribute: TmplAstBoundAttribute | TmplAstTextAttribute): Literal[] {
  if(isTextAttribute(attribute)){
    return createLiteralsByAngularTextAttribute(ctx, attribute);
  }
  if(isBoundAttribute(attribute) && isASTWithSource(attribute.value) && isLiteralPrimitive(attribute.value.ast)){
    return createLiteralsByAngularAst(ctx, attribute.value.ast);
  }
  return [];
}

function getLiteralsByAngularMatchers(ctx: Rule.RuleContext, ast: AST | TmplAstBoundAttribute, matchers: SelectorMatcher[]): Literal[] {
  const matcherFunctions = getAngularMatcherFunctions(ctx, matchers);

  const matchingAstNodes = getLiteralNodesByMatchers<AST>(ctx, ast, matcherFunctions);
  const literals = matchingAstNodes.flatMap(ast => createLiteralsByAngularAst(ctx, ast));

  return literals.filter(deduplicateLiterals);
}

function getAngularMatcherFunctions(ctx: Rule.RuleContext, matchers: SelectorMatcher[]): MatcherFunctions {
  return matchers.reduce<MatcherFunctions>((matcherFunctions, matcher) => {
    switch (matcher.type){
      case MatcherType.String: {
        matcherFunctions.push(ast => {

          if(
            isAST(ast) &&
            isCallExpression(ast)
          ){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isAST(ast) ||

            isInsideConditionalExpressionCondition(ctx, ast) ||
            isInsideLogicalExpressionLeft(ctx, ast) ||

            isObjectKey(ast) ||
            isInsideObjectValue(ctx, ast)){
            return MATCHER_RESULT.NO_MATCH;
          }

          return isStringLike(ast) || isBoundAttributeName(ast);
        });
        break;
      }
      case MatcherType.ObjectKey: {
        matcherFunctions.push(ast => {

          if(isAST(ast) && (
            isCallExpression(ast) ||
            isBoundAttributeName(ast)
          )){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isAST(ast) ||
            !isObjectKey(ast) ||

            isInsideConditionalExpressionCondition(ctx, ast) ||
            isInsideLogicalExpressionLeft(ctx, ast)){
            return MATCHER_RESULT.NO_MATCH;
          }

          const path = getAngularObjectPath(ctx, ast);

          if(!path || !matcher.path){
            return MATCHER_RESULT.MATCH;
          }

          return matchesPathPattern(path, matcher.path);
        });
        break;
      }
      case MatcherType.ObjectValue: {
        matcherFunctions.push(ast => {

          if(isAST(ast) && (
            isCallExpression(ast) ||
            isBoundAttributeName(ast)
          )){
            return MATCHER_RESULT.UNCROSSABLE_BOUNDARY;
          }

          if(
            !isAST(ast) ||
            !hasParent(ast) ||
            !isInsideObjectValue(ctx, ast) ||

            isInsideConditionalExpressionCondition(ctx, ast) ||
            isInsideLogicalExpressionLeft(ctx, ast) ||
            isObjectKey(ast) ||

            !isStringLike(ast)
          ){
            return MATCHER_RESULT.NO_MATCH;
          }

          const path = getAngularObjectPath(ctx, ast);

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

function getAngularObjectPath(ctx: Rule.RuleContext, ast: AST): string | undefined {
  const parent = findParent(ctx, ast);

  if(!parent){
    return;
  }

  const paths: (string | undefined)[] = [];

  if(isObjectKey(ast)){
    paths.unshift(createObjectPathElement(ast.key));
  }

  if(isLiteralArray(parent)){
    const index = parent.expressions.indexOf(ast);
    paths.unshift(`[${index}]`);
  }

  if(isLiteralMap(parent) && isInsideObjectValue(ctx, ast)){
    const keyIndex = parent.values.indexOf(ast);
    const objectKey = parent.keys[keyIndex];

    if(objectKey && isObjectKey(objectKey)){
      paths.unshift(createObjectPathElement(objectKey.key));
    }
  }

  paths.unshift(getAngularObjectPath(ctx, parent));

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

function createLiteralsByAngularBoundAttributeName(ctx: Rule.RuleContext, attribute: TmplAstBoundAttribute): Literal[] {

  if(!attribute.keySpan){
    return [];
  }

  const content = attribute.name;

  const startOffset = attribute.keySpan.toString()?.indexOf(content) ?? 0;

  const start = attribute.keySpan.fullStart;
  const end = attribute.keySpan.end;
  const range = [start.offset + startOffset, end.offset] satisfies [number, number];
  const raw = attribute.sourceSpan.start.file.content.slice(...range);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const loc = convertParseSourceSpanToLoc(attribute.keySpan);

  loc.start.column += startOffset;
  loc.end.column = loc.start.column + content.length;

  const line = ctx.sourceCode.lines[loc.start.line - 1];
  const indentation = getIndentation(line);
  const supportsMultiline = false;
  const concatenation = {
    isConcatenatedLeft: false,
    isConcatenatedRight: false
  };

  return [{
    ...quotes,
    ...whitespaces,
    ...concatenation,
    content,
    indentation,
    loc,
    range,
    raw,
    supportsMultiline,
    type: "StringLiteral"
  }];
}

function createLiteralByLiteralMapKey(ctx: Rule.RuleContext, key: LiteralMapPropertyKey): Literal[] {
  // @ts-expect-error - angular types are faulty
  const literalMap = key?.parent as LiteralMap | undefined;
  // @ts-expect-error - angular types are faulty
  const objectContent = literalMap?.parent?.source;
  const keyContent = key?.key;
  const keyIndex = literalMap?.keys.indexOf(key);

  if(keyIndex === undefined || keyIndex === -1){
    return [];
  }

  const previousValue = literalMap?.values[keyIndex - 1];
  const value = literalMap?.values[keyIndex];

  if(!literalMap?.sourceSpan || typeof objectContent !== "string" || typeof keyContent !== "string"){
    return [];
  }

  const rangeStart = previousValue?.span?.end ?? 0;
  const rangeEnd = value?.span?.start ?? objectContent.length;

  const slice = objectContent.slice(rangeStart, rangeEnd);

  const start = rangeStart + slice.indexOf(keyContent) - (key.quoted ? 1 : 0);
  const end = start + keyContent.length + (key.quoted ? 1 : 0);

  const raw = objectContent.slice(start, end);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(keyContent);
  const range = [literalMap.sourceSpan.start + start, literalMap.sourceSpan.start + end] satisfies [number, number];
  const loc = getLocByRange(ctx, range);
  const line = ctx.sourceCode.lines[loc.start.line - 1] ?? "";
  const indentation = getIndentation(line);
  const concatenation = {
    isConcatenatedLeft: false,
    isConcatenatedRight: false
  };

  return [{
    ...quotes,
    ...whitespaces,
    ...concatenation,
    content: keyContent,
    indentation,
    loc,
    range,
    raw,
    supportsMultiline: false,
    type: "StringLiteral"
  }];
}

function createLiteralsByAngularTextAttribute(ctx: Rule.RuleContext, attribute: TmplAstTextAttribute): Literal[] {
  const content = attribute.value;

  if(!attribute.valueSpan){
    return [];
  }

  const start = attribute.valueSpan.fullStart;
  const end = attribute.valueSpan.end;
  const range = [start.offset - 1, end.offset + 1] satisfies [number, number];
  const raw = attribute.sourceSpan.start.file.content.slice(...range);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const loc = convertParseSourceSpanToLoc(attribute.valueSpan);
  const line = ctx.sourceCode.lines[loc.start.line - 1];
  const indentation = getIndentation(line);
  const supportsMultiline = true;
  const concatenation = {
    isConcatenatedLeft: false,
    isConcatenatedRight: false
  };

  return [{
    ...quotes,
    ...whitespaces,
    ...concatenation,
    content,
    indentation,
    loc,
    range,
    raw,
    supportsMultiline,
    type: "StringLiteral"
  }];
}

function createLiteralByAngularLiteralPrimitive(ctx: Rule.RuleContext, literal: LiteralPrimitive): Literal[] {
  return createLiteralByAngularLiteralPrimitiveInternal(ctx, literal, createVisitedNodes());
}

function createLiteralByAngularLiteralPrimitiveInternal(ctx: Rule.RuleContext, literal: LiteralPrimitive, visitedNodes: Set<AST>): Literal[] {
  const content = literal.value;

  if(!literal.sourceSpan || typeof content !== "string"){
    return [];
  }

  const start = literal.sourceSpan.start;
  const end = literal.sourceSpan.end;
  const range = [start, end] satisfies [number, number];
  const raw = ctx.sourceCode.text.slice(...range);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const loc = getLocByRange(ctx, range);
  const line = ctx.sourceCode.lines[loc.start.line - 1];
  const indentation = getIndentation(line);
  const concatenation = getStringConcatenationMeta(ctx, literal, visitedNodes);
  const supportsMultiline = true;

  return [{
    ...quotes,
    ...whitespaces,
    ...concatenation,
    content,
    indentation,
    loc,
    range,
    raw,
    supportsMultiline,
    type: "StringLiteral"
  }];
}

function createLiteralByAngularTemplateLiteralElement(ctx: Rule.RuleContext, literal: TemplateLiteralElement): Literal[] {
  return createLiteralByAngularTemplateLiteralElementInternal(ctx, literal, createVisitedNodes());
}

function createLiteralByAngularTemplateLiteralElementInternal(ctx: Rule.RuleContext, literal: TemplateLiteralElement, visitedNodes: Set<AST>): Literal[] {
  const content = literal.text;

  if(!literal.sourceSpan || !hasParent(literal)){
    return [];
  }

  const braces = getBraces(literal);
  const isInterpolated = getIsInterpolated(literal);
  const start = literal.sourceSpan.start - (braces.closingBraces?.length ?? 0);
  const end = literal.sourceSpan.end + (braces.openingBraces?.length ?? 0);
  const range = [start, end] satisfies [number, number];
  const raw = ctx.sourceCode.text.slice(...range);
  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const loc = getLocByRange(ctx, range);

  const parent = literal.parent;
  const parentStart = parent.sourceSpan?.start;
  const parentEnd = parent.sourceSpan?.end;
  const parentRange = [parentStart, parentEnd] satisfies [number, number];
  const parentLoc = getLocByRange(ctx, parentRange);
  const parentLine = ctx.sourceCode.lines[parentLoc.start.line - 1];
  const indentation = getIndentation(parentLine);
  const supportsMultiline = true;
  const concatenation = getStringConcatenationMeta(ctx, literal, visitedNodes);

  return [{
    ...quotes,
    ...whitespaces,
    ...braces,
    ...concatenation,
    content,
    indentation,
    isInterpolated,
    loc,
    range,
    raw,
    supportsMultiline,
    type: "TemplateLiteral"
  }];
}

function convertParseSourceSpanToLoc(sourceSpan: ParseSourceSpan): SourceLocation {
  return {
    end: {
      column: sourceSpan.end.col,
      line: sourceSpan.end.line + 1
    },
    start: {
      column: sourceSpan.fullStart.col,
      line: sourceSpan.fullStart.line + 1
    }
  };
}

function isInsideInlineTemplate(ctx: Rule.RuleContext) {
  return getInlineTemplateComponentIndex(ctx) !== undefined;
}

function getInlineTemplateComponentIndex(ctx: Rule.RuleContext) {
  const matches = ctx.filename.match(/^.*_inline-template-[\w.-]+-(\d+)\.component\.html$/);

  if(matches){
    const [, index] = matches;
    return +index;
  }
}

function getBraces(literal: TemplateLiteralElement): BracesMeta {
  if(!hasParent(literal)){
    return {};
  }

  const parent = literal.parent as TemplateLiteral;
  const index = parent.elements.indexOf(literal);

  if(parent.elements.length === 1){
    return {};
  }

  return {
    closingBraces: index >= 1 ? "}" : undefined,
    openingBraces: index < parent.elements.length - 1 ? "${" : undefined
  };
}

function getIsInterpolated(literal: TemplateLiteralElement): boolean {
  const braces = getBraces(literal);
  return !!braces.closingBraces || !!braces.openingBraces;
}

function getAttributeName(node: TmplAstBoundAttribute | TmplAstTextAttribute): string {
  if(!node.keySpan){
    return node.name;
  }

  return node.sourceSpan.start.offset !== node.keySpan.start.offset
    ? node.sourceSpan.fullStart.file.content.slice(node.sourceSpan.start.offset, node.keySpan.end.offset + 1)
    : node.keySpan.toString() ?? node.name;
}

export type Parent = {
  parent: AST;
};

function isInsideConditionalExpressionCondition(ctx: Rule.RuleContext, ast: AST): boolean {
  const parent = findParent(ctx, ast);
  if(!parent){ return false; }

  if(isConditional(parent) && parent.condition === ast){
    return true;
  }

  return isInsideConditionalExpressionCondition(ctx, parent);
}

function isInsideLogicalExpressionLeft(ctx: Rule.RuleContext, ast: AST): boolean {
  const parent = findParent(ctx, ast);
  if(!parent){ return false; }

  if(isBinary(parent) && parent.operation === "&&" && parent.left === ast){
    return true;
  }

  return isInsideConditionalExpressionCondition(ctx, parent);
}

type ConcatenationLeafNodes<Node> = {
  hasDynamicValue: boolean;
  nodes: Node[];
};

function getStringConcatenationMeta(ctx: Rule.RuleContext, ast: AST, visitedNodes?: Set<AST>): ConcatenationMeta {

  const { isConcatenatedLeft, isConcatenatedRight } = getStringConcatenationDirection(ctx, ast);

  const visited = createVisitedNodes(visitedNodes);
  visitNode(visited, ast);

  const leftNodes =
    findAdjacentInterpolatedExpressionNodes(ctx, ast, "left") ??
    findAdjacentTemplateQuasiNodes(ctx, ast, "left") ??
    findAdjacentPlusConcatenatedLiteralNodes(ctx, ast, "left");

  const leftLiterals = isConcatenatedLeft
    ? buildConcatenationNeighborLiterals(ctx, leftNodes?.nodes, visited)
    : undefined;

  const hasDynamicLeftNeighbor = isConcatenatedLeft && !!leftNodes?.hasDynamicValue;

  const rightNodes =
    findAdjacentInterpolatedExpressionNodes(ctx, ast, "right") ??
    findAdjacentTemplateQuasiNodes(ctx, ast, "right") ??
    findAdjacentPlusConcatenatedLiteralNodes(ctx, ast, "right");

  const rightLiterals = isConcatenatedRight
    ? buildConcatenationNeighborLiterals(ctx, rightNodes?.nodes, visited)
    : undefined;

  const hasDynamicRightNeighbor = isConcatenatedRight && !!rightNodes?.hasDynamicValue;

  return {
    hasDynamicLeftNeighbor,
    hasDynamicRightNeighbor,
    isConcatenatedLeft,
    isConcatenatedRight,
    leftLiterals,
    rightLiterals
  };
}

function buildConcatenationNeighborLiterals(ctx: Rule.RuleContext, nodes: AST[] | undefined, visited: Set<AST>): Literal[] | undefined {
  if(!nodes){ return; }

  return nodes
    .filter(adjacentNode => visitNode(visited, adjacentNode))
    .map(adjacentNode => buildConcatenationNeighborLiteral(ctx, adjacentNode, visited))
    .filter((literal): literal is Literal => literal !== undefined);
}

function getStringConcatenationDirection(ctx: Rule.RuleContext, ast: AST, isConcatenatedLeft = false, isConcatenatedRight = false): { isConcatenatedLeft: boolean; isConcatenatedRight: boolean; } {
  const parent = findParent(ctx, ast);
  if(!parent){
    return {
      isConcatenatedLeft,
      isConcatenatedRight
    };
  }

  if(isCallExpression(parent)){
    return {
      isConcatenatedLeft,
      isConcatenatedRight
    };
  }

  if(isTemplateLiteral(parent) && !isTemplateLiteralElement(ast)){
    return {
      isConcatenatedLeft: true,
      isConcatenatedRight: true
    };
  }

  if(isTemplateLiteralElement(ast) && isTemplateLiteral(parent)){
    const index = parent.elements.indexOf(ast);
    return getStringConcatenationDirection(
      ctx,
      parent,
      isConcatenatedLeft || index > 0,
      isConcatenatedRight || index < parent.elements.length - 1
    );
  }

  if(isBinary(parent) && parent.operation === "+"){
    return getStringConcatenationDirection(
      ctx,
      parent,
      isConcatenatedLeft || parent.right === ast,
      isConcatenatedRight || parent.left === ast
    );
  }

  return getStringConcatenationDirection(ctx, parent, isConcatenatedLeft, isConcatenatedRight);
}

function findAdjacentPlusConcatenatedLiteralNodes(ctx: Rule.RuleContext, ast: AST, direction: "left" | "right"): ConcatenationLeafNodes<AST> | undefined {
  const sibling = findConcatenationCounterpart(ctx, ast, direction);
  if(!sibling){ return; }
  const leafNodes = findConcatenationLeafNodes(sibling, direction === "left" ? "right" : "left");
  return leafNodes.nodes.length > 0 || leafNodes.hasDynamicValue ? leafNodes : undefined;
}

function findAdjacentInterpolatedExpressionNodes(ctx: Rule.RuleContext, ast: AST, direction: "left" | "right"): ConcatenationLeafNodes<AST> | undefined {
  if(!isTemplateLiteralElement(ast)){ return; }

  const parent = findParent(ctx, ast);
  if(!parent || !isTemplateLiteral(parent)){ return; }

  const index = parent.elements.indexOf(ast);
  if(index === -1){ return; }

  const expression = direction === "left" ? parent.expressions[index - 1] : parent.expressions[index];
  if(!expression){ return; }

  const leafNodes = findConcatenationLeafNodes(expression, direction);
  return leafNodes.nodes.length > 0 || leafNodes.hasDynamicValue ? leafNodes : undefined;
}

function findAdjacentTemplateQuasiNodes(ctx: Rule.RuleContext, ast: AST, direction: "left" | "right"): ConcatenationLeafNodes<AST> | undefined {
  let current: AST = ast;

  while(true){
    const parent = findParent(ctx, current);

    if(!parent){ break; }

    if(isTemplateLiteral(parent)){
      if(isTemplateLiteralElement(current)){
        current = parent;
        continue;
      }

      const index = parent.expressions.indexOf(current);
      if(index === -1){ return; }

      const element = direction === "left" ? parent.elements[index] : parent.elements[index + 1];
      return element ? { hasDynamicValue: false, nodes: [element] } : undefined;
    }

    if(isParenthesizedExpression(parent)){
      current = parent;
      continue;
    }

    if(isConditional(parent) && (parent.trueExp === current || parent.falseExp === current)){
      current = parent;
      continue;
    }

    if(
      isBinary(parent) &&
      parent.right === current &&
      (
        parent.operation === "&&" ||
        parent.operation === "||" ||
        parent.operation === "??"
      )
    ){
      current = parent;
      continue;
    }

    break;
  }
}

function findConcatenationCounterpart(ctx: Rule.RuleContext, ast: AST, direction: "left" | "right"): AST | undefined {
  let current: AST = ast;

  while(true){
    const parent = findParent(ctx, current);

    if(!parent){ break; }
    if(isCallExpression(parent)){ break; }

    if(isParenthesizedExpression(parent)){
      current = parent;
      continue;
    }

    if(isConditional(parent) && (parent.trueExp === current || parent.falseExp === current)){
      current = parent;
      continue;
    }

    if(isTemplateLiteral(parent)){
      const elements = parent.elements;
      const isEdge = direction === "left"
        ? elements[0] === current
        : elements[elements.length - 1] === current;

      if(isEdge){
        current = parent;
        continue;
      }

      break;
    }

    if(isBinary(parent) && parent.operation === "+"){
      if(direction === "left" && parent.right === current){ return parent.left; }
      if(direction === "right" && parent.left === current){ return parent.right; }
      current = parent;
      continue;
    }

    if(
      isBinary(parent) &&
      parent.right === current &&
      (
        parent.operation === "&&" ||
        parent.operation === "||" ||
        parent.operation === "??"
      )
    ){
      current = parent;
      continue;
    }

    break;
  }
}

function findConcatenationLeafNodes(ast: AST, edge: "left" | "right"): ConcatenationLeafNodes<AST> {
  if(isParenthesizedExpression(ast)){
    return findConcatenationLeafNodes(ast.expression, edge);
  }

  if(isStringLiteral(ast)){
    return { hasDynamicValue: false, nodes: [ast] };
  }

  if(isLiteralPrimitive(ast)){
    return { hasDynamicValue: true, nodes: [] };
  }

  if(isTemplateLiteral(ast)){
    const elements = ast.elements;
    const edgeElement = edge === "left" ? elements[0] : elements[elements.length - 1];
    const adjacentExpression = ast.expressions[edge === "left" ? 0 : ast.expressions.length - 1];
    const hasDynamicValue = !!edgeElement && edgeElement.text.length === 0 && !!adjacentExpression && findConcatenationLeafNodes(adjacentExpression, edge).hasDynamicValue;
    return { hasDynamicValue, nodes: edgeElement ? [edgeElement] : [] };
  }

  if(isBinary(ast) && ast.operation === "+"){
    return findConcatenationLeafNodes(edge === "left" ? ast.left : ast.right, edge);
  }

  if(isConditional(ast)){
    const branches = [
      findConcatenationLeafNodes(ast.trueExp, edge),
      findConcatenationLeafNodes(ast.falseExp, edge)
    ];

    return {
      hasDynamicValue: branches.some(branch => branch.hasDynamicValue),
      nodes: branches.flatMap(branch => branch.nodes)
    };
  }

  if(
    isBinary(ast) &&
    (
      ast.operation === "&&" ||
      ast.operation === "||" ||
      ast.operation === "??"
    )
  ){
    const left = findConcatenationLeafNodes(ast.left, edge);
    const right = findConcatenationLeafNodes(ast.right, "left");

    return {
      hasDynamicValue: left.hasDynamicValue || right.hasDynamicValue,
      nodes: right.nodes
    };
  }

  return { hasDynamicValue: true, nodes: [] };
}

function buildConcatenationNeighborLiteral(ctx: Rule.RuleContext, ast: AST | undefined, visitedNodes: Set<AST>): Literal | undefined {
  if(!ast){ return; }

  if(isStringLiteral(ast)){
    return createLiteralByAngularLiteralPrimitiveInternal(ctx, ast, visitedNodes)[0];
  }

  if(isTemplateLiteralElement(ast)){
    return createLiteralByAngularTemplateLiteralElementInternal(ctx, ast, visitedNodes)[0];
  }
}

function isInsideObjectValue(ctx: Rule.RuleContext, ast: AST): boolean {
  const parent = findParent(ctx, ast);
  if(!parent){ return false; }

  // #34 allow call expressions as object values
  if(isCallExpression(ast)){ return false; }

  if(isObjectValue(ast)){
    return true;
  }

  if(isLiteralMap(parent) && parent.values.includes(ast)){
    return true;
  }

  return isInsideObjectValue(ctx, parent);
}

function isStringLike(ast: AST): ast is LiteralPrimitive | TemplateLiteralElement {
  return isStringLiteral(ast) || isTemplateLiteralElement(ast);
}

function hasParent(ast: AST): ast is AST & Parent {
  return "parent" in ast && ast.parent !== undefined;
}

/**
 * The angular parser doesn't provide parent references for all nodes. This function traverses the entire AST
 * to find the parent node of the given AST reference.
 *
 * @param ctx The ESLint rule context.
 * @param astNode The AST node to find the parent for.
 * @returns The parent AST node, or undefined if not found.
 */
function findParent(ctx: Rule.RuleContext, astNode: AST): AST | undefined {
  if(hasParent(astNode)){
    return astNode.parent;
  }

  const ast = ctx.sourceCode.ast;

  const visitChildNode = (childNode: unknown) => {
    if(!childNode || typeof childNode !== "object"){
      return;
    }

    for(const key in childNode){
      if(key === "parent"){
        continue;
      }

      if(childNode[key] === astNode){
        return childNode;
      }

      const result = visitChildNode(childNode[key]);

      if(result){
        return result;
      }
    }
  };

  return visitChildNode(ast);
}

function isBoundAttributeName(ast: AST | TmplAstBoundAttribute | TmplAstTextAttribute): boolean {
  return isBoundAttribute(ast) && getAttributeName(ast)?.startsWith("[class.");
}

function isObjectValue(ast: AST): ast is LiteralPrimitive {
  return isStringLiteral(ast) && hasParent(ast) && isLiteralMap(ast.parent);
}

function isObjectKey(ast: Record<string, any>): ast is LiteralMapPropertyKey {
  return "type" in ast && ast.type === "Object" && "key" in ast && ast.key !== undefined;
}

function isStringLiteral(ast: AST): ast is LiteralPrimitive {
  return isLiteralPrimitive(ast) && typeof ast.value === "string";
}

export function isAST(ast: unknown): ast is AST {
  return typeof ast === "object" && ast !== null && "type" in ast;
}

function is<Type extends AST | TmplAstNode>(ast: AST | TmplAstNode, type: string): ast is Type {
  return "type" in ast && typeof ast.type === "string" && ast.type === type;
}

const isCallExpression = (ast: AST) => is<Call>(ast, "Call");
const isASTWithSource = (ast: AST) => is<ASTWithSource>(ast, "ASTWithSource");
const isInterpolation = (ast: AST) => is<Interpolation>(ast, "Interpolation");
const isConditional = (ast: AST) => is<Conditional>(ast, "Conditional");
const isParenthesizedExpression = (ast: AST) => is<ParenthesizedExpression>(ast, "ParenthesizedExpression");
const isBinary = (ast: AST) => is<Binary>(ast, "Binary");
const isLiteralArray = (ast: AST) => is<LiteralArray>(ast, "LiteralArray");
const isLiteralMap = (ast: AST) => is<LiteralMap>(ast, "LiteralMap");
const isTemplateLiteral = (ast: AST) => is<TemplateLiteral>(ast, "TemplateLiteral");
const isTemplateLiteralElement = (ast: AST) => is<TemplateLiteralElement>(ast, "TemplateLiteralElement");
const isLiteralPrimitive = (ast: AST) => is<LiteralPrimitive>(ast, "LiteralPrimitive");

const isTextAttribute = (ast: AST | TmplAstBoundAttribute | TmplAstTextAttribute) => is<TmplAstTextAttribute>(ast, "TextAttribute");
const isBoundAttribute = (ast: AST | TmplAstBoundAttribute | TmplAstTextAttribute) => is<TmplAstBoundAttribute>(ast, "BoundAttribute");
