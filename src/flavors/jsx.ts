import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { AST, Rule } from "eslint";
import type {
  BaseNode as JSXBaseNode,
  CallExpression,
  Expression as JSXExpression,
  JSXAttribute,
  JSXExpressionContainer,
  JSXOpeningElement,
  Node as JSXNode,
  SimpleLiteral as JSXSimpleLiteral,
  SpreadElement as JSXSpreadElement,
  TemplateElement as JSXTemplateElement,
  TemplateLiteral as JSXTemplateLiteral
} from "estree-jsx";

import type { BracesMeta, Literal, Node, StringLiteral, TemplateLiteral } from "readable-tailwind:types:ast";
import type { CalleeRegex, Callees } from "readable-tailwind:types:rule.js";


export function getJSXClassAttributeLiterals(ctx: Rule.RuleContext, attribute: JSXAttribute): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  if(isSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isSimpleExpressionContainer(value)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value.expression);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isTemplateExpressionContainer(value)){
    return getLiteralsByJSXTemplateLiteral(ctx, value.expression);
  }

  return [];

}

export function getLiteralsByJSXCallExpression(ctx: Rule.RuleContext, jsxNode: CallExpression, callees: Callees): Literal[] {
  const literals = callees.reduce<Literal[]>((literals, callee) => {

    if(jsxNode.callee.type !== "Identifier"){ return literals; }

    if(typeof callee === "string"){
      if(callee !== jsxNode.callee.name){ return literals; }

      literals.push(...getLiteralsByJSXCallExpressionAndStringCallee(ctx, jsxNode.arguments));
    } else {
      literals.push(...getLiteralsByJSXCallExpressionAndRegexCallee(ctx, jsxNode, callee));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);
}

function getLiteralsByJSXCallExpressionAndStringCallee(ctx: Rule.RuleContext, args: (JSXExpression | JSXSpreadElement)[]): Literal[] {
  return args.reduce<Literal[]>((acc, arg) => {
    if(arg.type === "SpreadElement"){ return acc; }
    const literals = getLiteralsByExpression(ctx, arg);
    return [...acc, ...literals];
  }, []);
}

function getLiteralsByJSXCallExpressionAndRegexCallee(ctx: Rule.RuleContext, node: JSXNode, regexCallee: CalleeRegex): Literal[] {

  const [containerRegexString, stringLiteralRegexString] = regexCallee;

  const sourceCode = ctx.sourceCode.getText(node);

  const containerRegex = new RegExp(containerRegexString, "g");
  const stringLiteralRegex = new RegExp(stringLiteralRegexString, "g");
  const containers = sourceCode.matchAll(containerRegex);

  const matchedLiterals: Literal[] = [];

  for(const container of containers){
    const stringLiterals = container[0].matchAll(stringLiteralRegex);

    for(const stringLiteral of stringLiterals){
      if(!stringLiteral.index){ continue; }

      const node = ctx.sourceCode.getNodeByRangeIndex(stringLiteral.index);

      if(!node){ continue; }

      const literals = isSimpleStringLiteral(node)
        ? getStringLiteralByJSXStringLiteral(ctx, node)
        : isTemplateExpressionContainer(node)
          ? getLiteralsByJSXTemplateLiteral(ctx, node.expression)
          : undefined;

      if(literals === undefined){ continue; }

      matchedLiterals.push(
        ...Array.isArray(literals) ? literals : [literals]
      );
    }

  }

  return matchedLiterals;

}

function getLiteralsByExpression(ctx: Rule.RuleContext, node: JSXExpression): Literal[] {

  if(isSimpleStringLiteral(node)){
    const simpleStringLiteral = getStringLiteralByJSXStringLiteral(ctx, node);
    if(simpleStringLiteral){
      return [simpleStringLiteral];
    }
  }

  if(isTemplateLiteral(node)){
    return getLiteralsByJSXTemplateLiteral(ctx, node);
  }

  return [];

}

export function getStringLiteralByJSXStringLiteral(ctx: Rule.RuleContext, node: JSXSimpleStringLiteral): StringLiteral | undefined {

  const token = getTokenByNode(ctx, node);

  if(!token || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const raw = token.value;
  const content = node.value;

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return {
    ...quotes,
    ...whitespaces,
    content,
    loc: node.loc,
    parent: node.parent as Node,
    range: node.range,
    raw,
    type: "StringLiteral"
  };

}

export function getLiteralByJSXTemplateElement(ctx: Rule.RuleContext, node: JSXTemplateElement & Rule.Node): TemplateLiteral | undefined {

  const token = getTokenByNode(ctx, node);

  if(!token || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const raw = token.value;
  const content = node.value.raw;

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const braces = getTemplateTokenBraces(ctx, token);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    content,
    loc: node.loc,
    parent: node.parent as Node,
    range: node.range,
    raw,
    type: "TemplateLiteral"
  };

}

export function getLiteralsByJSXTemplateLiteral(ctx: Rule.RuleContext, node: JSXTemplateLiteral): TemplateLiteral[] {
  return node.quasis.map(quasi => {
    if(!hasNodeParentExtension(quasi)){
      return;
    }
    return getLiteralByJSXTemplateElement(ctx, quasi);
  }).filter((literal): literal is TemplateLiteral => literal !== undefined);
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

function getTokenByNode(ctx: Rule.RuleContext, node: JSXBaseNode) {
  return node.range?.[0]
    ? ctx.sourceCode.getTokenByRangeStart(node.range[0])
    : undefined;
}

export function getTemplateTokenBraces(ctx: Rule.RuleContext, token: AST.Token): BracesMeta {
  const closingBraces = token.value.startsWith("}") ? "}" : undefined;
  const openingBraces = token.value.endsWith("${") ? "${" : undefined;

  return {
    closingBraces,
    openingBraces
  };
}

export function hasNodeParentExtension(node: JSXNode): node is Rule.Node & Rule.NodeParentExtension {
  return "parent" in node;
}

interface JSXSimpleStringLiteral extends Rule.NodeParentExtension, JSXSimpleLiteral {
  value: string;
}

function isJSXNode(node: unknown): node is JSXNode {
  return node !== null &&
    typeof node === "object" &&
    "type" in node;
}

function isJSXAttribute(node: JSXBaseNode): node is JSXAttribute {
  return node.type === "JSXAttribute";
}

export function isSimpleStringLiteral(node: JSXBaseNode): node is JSXSimpleStringLiteral {
  return node.type === "Literal" &&
    "value" in node &&
    typeof node.value === "string";
}

export function isTemplateLiteral(node: JSXBaseNode): node is JSXTemplateLiteral {
  return node.type === "TemplateLiteral";
}

export function isSimpleExpressionContainer(node: JSXBaseNode): node is JSXExpressionContainer & { expression: JSXSimpleStringLiteral; } {
  return node.type === "JSXExpressionContainer" && "expression" in node &&
    isJSXNode(node.expression) &&
    isSimpleStringLiteral(node.expression);
}

export function isTemplateExpressionContainer(node: JSXBaseNode): node is JSXExpressionContainer & { expression: JSXTemplateLiteral; } {
  return node.type === "JSXExpressionContainer" && "expression" in node &&
    isJSXNode(node.expression) &&
    isTemplateLiteral(node.expression);
}
