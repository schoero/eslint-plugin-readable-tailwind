import { getOptions } from "eptm:rules:tailwind-sort-classes";
import { getWhitespace } from "eptm:utils:utils.js";

import type { AST, Rule } from "eslint";
import type {
  BaseNode,
  Expression,
  JSXAttribute,
  JSXOpeningElement,
  Node,
  SimpleLiteral,
  SpreadElement,
  TemplateElement,
  TemplateLiteral
} from "estree-jsx";
import type { BracesParts, QuoteParts } from "src/types/ast";


export function findStartPosition(ctx: Rule.RuleContext, node: Node) {
  const line = node.loc?.start.line;

  if(line === undefined){ return 0; }

  return ctx.sourceCode.lines[line - 1].match(/^\s*/)?.[0]?.length ?? node.loc?.start.column ?? 0;
}

export function getClassAttributeLiterals(ctx: Rule.RuleContext, attribute: JSXAttribute): Literals {

  const value = attribute.value;

  if(value === null){
    return [];
  }

  // class="a b"
  if(isSimpleStringLiteral(value)){
    const simpleStringLiteral = getLiteralBySimpleStringLiteral(ctx, value);
    return [simpleStringLiteral];
  }

  // class={"a b"}
  if(value.type === "JSXExpressionContainer" && isSimpleStringLiteral(value.expression)){
    const simpleStringLiteral = getLiteralBySimpleStringLiteral(ctx, value.expression);
    return [simpleStringLiteral];
  }

  // class={`a b ... c`}
  if(value.type === "JSXExpressionContainer" && value.expression.type === "TemplateLiteral"){
    return getLiteralsByTemplateLiteral(ctx, value.expression);
  }

  // TODO: Handle class={" a " + " b "} // Create a new rule 'no-unnecessary-concat'

  return [];
}

export function getCallExpressionLiterals(ctx: Rule.RuleContext, args: (Expression | SpreadElement)[]): Literals {
  return args.reduce<Literals>((acc, arg) => {
    if(arg.type === "SpreadElement"){ return acc; }
    const literals = getLiteralsByExpression(ctx, arg);
    return [...acc, ...literals];
  }, []);
}

export function getLiteralsByExpression(ctx: Rule.RuleContext, node: Expression): Literals {

  // {"a b"}
  if(isSimpleStringLiteral(node)){
    const simpleStringLiteral = getLiteralBySimpleStringLiteral(ctx, node);
    return [simpleStringLiteral];
  }

  // {`a b ... c`}
  if(node.type === "TemplateLiteral"){
    return getLiteralsByTemplateLiteral(ctx, node);
  }

  return [];
}

function getLiteralBySimpleStringLiteral(ctx: Rule.RuleContext, node: SimpleStringLiteral): StringLiteral | undefined {

  const token = getTokenByNode(ctx, node);

  if(!token){ return; }

  const raw = token.value;
  const content = node.value;

  const quotes = getTextTokenQuotes(ctx, token);
  const whitespaces = getWhitespace(content);

  return {
    ...node,
    ...quotes,
    ...whitespaces,
    content,
    raw
  };

}

function getLiteralByTemplateElement(ctx: Rule.RuleContext, node: TemplateElement): TemplateLiteralString | undefined {

  const token = getTokenByNode(ctx, node);

  if(!token){ return; }

  const raw = token.value;
  const content = node.value.raw;

  const quotes = getTemplateTokenQuotes(ctx, token);
  const braces = getTemplateTokenBraces(ctx, token);
  const whitespaces = getWhitespace(content);

  return {
    ...node,
    ...whitespaces,
    ...quotes,
    ...braces,
    content,
    raw
  };

}

function getLiteralsByTemplateLiteral(ctx: Rule.RuleContext, node: TemplateLiteral): (TemplateLiteralString | undefined)[] {
  return node.quasis.map(quasi => getLiteralByTemplateElement(ctx, quasi));
}

export function getTokenByNode(ctx: Rule.RuleContext, node: BaseNode) {
  return node.range?.[0]
    ? ctx.sourceCode.getTokenByRangeStart(node.range[0])
    : undefined;
}

export function getTextTokenQuotes(ctx: Rule.RuleContext, token: AST.Token): QuoteParts {
  const openingQuote = token.value.at(0);
  const closingQuote = token.value.at(-1);

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' ? openingQuote : undefined
  };
}

export function getTemplateTokenQuotes(ctx: Rule.RuleContext, token: AST.Token): QuoteParts {
  const openingQuote = token.value.startsWith("`") ? "`" : undefined;
  const closingQuote = token.value.endsWith("`") ? "`" : undefined;

  return {
    closingQuote: closingQuote === "`" ? closingQuote : undefined,
    openingQuote: openingQuote === "`" ? openingQuote : undefined
  };
}

export function getTemplateTokenBraces(ctx: Rule.RuleContext, token: AST.Token): BracesParts {
  const closingBraces = token.value.startsWith("}") ? "}" : undefined;
  const openingBraces = token.value.endsWith("${") ? "${" : undefined;

  return {
    closingBraces,
    openingBraces
  };
}

interface SimpleStringLiteral extends SimpleLiteral {
  value: string;
}

export interface StringLiteral extends SimpleStringLiteral, QuoteParts {
  content: string;
  raw: string;
}

export interface TemplateLiteralString extends TemplateElement, QuoteParts, BracesParts {
  content: string;
  raw: string;
}

export type Literals = (StringLiteral | TemplateLiteralString | undefined)[];

export function isJSXAttribute(node: BaseNode): node is JSXAttribute {
  return node.type === "JSXAttribute";
}

function isSimpleStringLiteral(node: BaseNode): node is SimpleStringLiteral {
  return node.type === "Literal" &&
    "value" in node &&
    typeof node.value === "string";
} export function getClassAttributes(ctx: Rule.RuleContext, node: JSXOpeningElement): JSXAttribute[] {

  const { classAttributes } = getOptions(ctx);

  return node.attributes.reduce<JSXAttribute[]>((acc, attribute) => {
    if(isJSXAttribute(attribute) && classAttributes.includes(attribute.name.name as string)){
      acc.push(attribute);
    }
    return acc;
  }, []);

}
