import { getOptions } from "eptm:rules:tailwind-sort-classes";
import { getWhitespace } from "eptm:utils:utils.js";

import type { AST, Rule } from "eslint";
import type {
  BaseNode,
  Expression,
  JSXAttribute,
  JSXOpeningElement,
  SimpleLiteral,
  SpreadElement,
  TemplateElement,
  TemplateLiteral
} from "estree-jsx";
import type { BracesParts, QuoteParts, WhitespaceParts } from "src/types/ast";


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

  // "a b"
  if(isSimpleStringLiteral(node)){
    const simpleStringLiteral = getLiteralBySimpleStringLiteral(ctx, node);
    return [simpleStringLiteral];
  }

  // `a b ... c`
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
  const leadingQuote = token.value.at(0);
  const trailingQuote = token.value.at(-1);

  return {
    leadingQuote: leadingQuote === "'" || leadingQuote === '"' ? leadingQuote : undefined,
    trailingQuote: trailingQuote === "'" || trailingQuote === '"' ? trailingQuote : undefined
  };
}

export function getTemplateTokenQuotes(ctx: Rule.RuleContext, token: AST.Token): QuoteParts {
  const leadingQuote = token.value.startsWith("`") ? "`" : undefined;
  const trailingQuote = token.value.endsWith("`") ? "`" : undefined;

  return {
    leadingQuote: leadingQuote === "`" ? leadingQuote : undefined,
    trailingQuote: trailingQuote === "`" ? trailingQuote : undefined
  };
}

// export function getTemplateTokenWhitespace(ctx: Rule.RuleContext, token: AST.Token): WhitespaceParts {

//   const { leadingQuote, trailingQuote } = getTemplateTokenQuotes(ctx, token);
//   const { leadingBraces, trailingBraces } = getTemplateTokenBraces(ctx, token);

//   const leadingWhitespace = token.value.at(
//     (leadingQuote?.length ?? 0) + (leadingBraces?.length ?? 0)
//   ) === " "
//     ? " "
//     : undefined;
//   const trailingWhitespace = token.value.at(
//     -((trailingQuote?.length ?? 0) + (trailingBraces?.length ?? 0) + 1)
//   ) === " "
//     ? " "
//     : undefined;

//   return {
//     leadingWhitespace,
//     trailingWhitespace
//   };
// }

export function getTemplateTokenBraces(ctx: Rule.RuleContext, token: AST.Token): BracesParts {
  const leadingBraces = token.value.startsWith("}") ? "}" : undefined;
  const trailingBraces = token.value.endsWith("${") ? "${" : undefined;

  return {
    leadingBraces,
    trailingBraces
  };
}

interface SimpleStringLiteral extends SimpleLiteral {
  value: string;
}

export interface StringLiteral extends SimpleStringLiteral, QuoteParts, WhitespaceParts {
  content: string;
  raw: string;
}

export interface TemplateLiteralString extends TemplateElement, QuoteParts, WhitespaceParts, BracesParts {
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
