import { getOptions, getWhitespace } from "eptm:utils:utils.js";

import type { AST, Rule } from "eslint";
import type { BaseNode, JSXAttribute, JSXOpeningElement, SimpleLiteral, TemplateElement } from "estree-jsx";

import type { BracesParts, QuoteParts, WhitespaceParts } from "eptm:utils:utils.js";


export function getClassAttributes(ctx: Rule.RuleContext, node: JSXOpeningElement): JSXAttribute[] {

  const { classAttributes } = getOptions(ctx);

  return node.attributes.reduce<JSXAttribute[]>((acc, attr) => {
    if(attr.type === "JSXAttribute" && classAttributes.includes(attr.name.name)){
      acc.push(attr);
    }
    return acc;
  }, []);

}


export function getClassAttributeLiterals(ctx: Rule.RuleContext, attribute: JSXAttribute): (StringLiteral | TemplateLiteralString | undefined)[] {

  const value = attribute.value;

  if(value === null){
    return [];
  }

  // class="a b"
  if(isSimpleStringLiteral(value)){

    const token = getTokenByNode(ctx, value);

    if(!token){ return []; }

    const raw = token.value;
    const content = value.value;

    const quotes = getTextTokenQuotes(ctx, token);
    const whitespaces = getWhitespace(ctx, content);

    return [{
      ...value,
      ...quotes,
      // Remove whitespace from simple literals
      // ...whitespaces,
      content,
      raw
    }];
  }

  // class={`a b`}
  if(value.type === "JSXExpressionContainer" && isSimpleStringLiteral(value.expression)){
    const token = getTokenByNode(ctx, value.expression);

    if(!token){ return []; }

    const raw = token.value;
    const content = value.expression.value;

    const quotes = getTextTokenQuotes(ctx, token);
    const whitespaces = getWhitespace(ctx, content);

    return [{
      ...value.expression,
      ...quotes,
      ...whitespaces,
      content,
      raw
    }];
  }

  // class={`a b ${someExpression} c`}
  if(value.type === "JSXExpressionContainer" && value.expression.type === "TemplateLiteral"){
    return value.expression.quasis.map(quasi => {

      const token = getTokenByNode(ctx, quasi);

      if(!token){ return; }

      const raw = token.value;
      const content = quasi.value.raw;

      const quotes = getTemplateTokenQuotes(ctx, token);
      const braces = getTemplateTokenBraces(ctx, token);
      const whitespaces = getWhitespace(ctx, content);

      return {
        ...quasi,
        ...whitespaces,
        ...quotes,
        ...braces,
        content,
        raw
      };

    });
  }

  return [];
}

function getTokenByNode(ctx: Rule.RuleContext, node: BaseNode) {
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

interface StringLiteral extends SimpleStringLiteral, QuoteParts, WhitespaceParts {
  content: string;
  raw: string;
}

interface TemplateLiteralString extends TemplateElement, QuoteParts, WhitespaceParts, BracesParts {
  content: string;
  raw: string;
}

function isSimpleStringLiteral(node: BaseNode): node is SimpleStringLiteral {
  return node.type === "Literal" &&
    "value" in node &&
    typeof node.value === "string";
}
