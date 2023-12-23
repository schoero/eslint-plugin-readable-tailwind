import { getWhitespace } from "eptm:utils:utils.js";

import type { AST, Rule } from "eslint";
import type {
  BaseNode as JSXBaseNode,
  Expression as JSXExpression,
  JSXAttribute,
  JSXOpeningElement,
  Node as JSXNode,
  SimpleLiteral as JSXSimpleLiteral,
  SpreadElement as JSXSpreadElement,
  TemplateElement as JSXTemplateElement,
  TemplateLiteral as JSXTemplateLiteral
} from "estree-jsx";
import type { BracesMeta, Literal, Node, QuoteMeta, StringLiteral, TemplateLiteral } from "src/types/ast";


export function getJSXClassAttributeLiterals(ctx: Rule.RuleContext, attribute: JSXAttribute): Literal[] {

  const value = attribute.value;

  if(!value){
    return [];
  }

  // class="a b"
  if(isSimpleStringLiteral(value)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  // class={"a b"}
  if(value.type === "JSXExpressionContainer" && isSimpleStringLiteral(value.expression)){
    const stringLiteral = getStringLiteralByJSXStringLiteral(ctx, value.expression);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  // class={`a b ... c`}
  if(value.type === "JSXExpressionContainer" && value.expression.type === "TemplateLiteral"){
    return getLiteralsByJSXTemplateLiteral(ctx, value.expression);
  }

  return [];

}

export function getLiteralsByJSXCallExpression(ctx: Rule.RuleContext, args: (JSXExpression | JSXSpreadElement)[]): Literal[] {
  return args.reduce<Literal[]>((acc, arg) => {
    if(arg.type === "SpreadElement"){ return acc; }
    const literals = getLiteralsByExpression(ctx, arg);
    return [...acc, ...literals];
  }, []);
}

function getLiteralsByExpression(ctx: Rule.RuleContext, node: JSXExpression): Literal[] {

  // {"a b"}
  if(isSimpleStringLiteral(node)){
    const simpleStringLiteral = getStringLiteralByJSXStringLiteral(ctx, node);
    if(simpleStringLiteral){
      return [simpleStringLiteral];
    }
  }

  // {`a b ... c`}
  if(node.type === "TemplateLiteral"){
    return getLiteralsByJSXTemplateLiteral(ctx, node);
  }

  return [];
}


function getStringLiteralByJSXStringLiteral(ctx: Rule.RuleContext, node: JSXSimpleStringLiteral): StringLiteral | undefined {

  const token = getTokenByNode(ctx, node);

  if(!token || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const raw = token.value;
  const content = node.value;

  const quotes = getTextTokenQuotes(ctx, token);
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

function getLiteralByJSXTemplateElement(ctx: Rule.RuleContext, node: JSXTemplateElement & Rule.Node): TemplateLiteral | undefined {

  const token = getTokenByNode(ctx, node);

  if(!token || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const raw = token.value;
  const content = node.value.raw;

  const quotes = getTemplateTokenQuotes(ctx, token);
  const braces = getTemplateTokenBraces(ctx, token);
  const whitespaces = getWhitespace(content);

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

function getLiteralsByJSXTemplateLiteral(ctx: Rule.RuleContext, node: JSXTemplateLiteral): TemplateLiteral[] {
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

export function getTokenByNode(ctx: Rule.RuleContext, node: JSXBaseNode) {
  return node.range?.[0]
    ? ctx.sourceCode.getTokenByRangeStart(node.range[0])
    : undefined;
}

function getTextTokenQuotes(ctx: Rule.RuleContext, token: AST.Token): QuoteMeta {
  const openingQuote = token.value.at(0);
  const closingQuote = token.value.at(-1);

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' ? openingQuote : undefined
  };
}

function getTemplateTokenQuotes(ctx: Rule.RuleContext, token: AST.Token): QuoteMeta {
  const openingQuote = token.value.startsWith("`") ? "`" : undefined;
  const closingQuote = token.value.endsWith("`") ? "`" : undefined;

  return {
    closingQuote: closingQuote === "`" ? closingQuote : undefined,
    openingQuote: openingQuote === "`" ? openingQuote : undefined
  };
}

function getTemplateTokenBraces(ctx: Rule.RuleContext, token: AST.Token): BracesMeta {
  const closingBraces = token.value.startsWith("}") ? "}" : undefined;
  const openingBraces = token.value.endsWith("${") ? "${" : undefined;

  return {
    closingBraces,
    openingBraces
  };
}

function isJSXAttribute(node: JSXBaseNode): node is JSXAttribute {
  return node.type === "JSXAttribute";
}

function isSimpleStringLiteral(node: JSXBaseNode): node is JSXSimpleStringLiteral {
  return node.type === "Literal" &&
    "value" in node &&
    typeof node.value === "string";
}

function hasNodeParentExtension(node: JSXNode): node is Rule.Node & Rule.NodeParentExtension {
  return "parent" in node;
}

interface JSXSimpleStringLiteral extends Rule.NodeParentExtension, JSXSimpleLiteral {
  value: string;
}
