import { getIndentation, getWhitespace } from "better-tailwindcss:utils/utils.js";

import type { Atrule } from "@eslint/css-tree";
import type { Rule } from "eslint";

import type { CSSClassListLiteral, Literal, Loc, Range } from "better-tailwindcss:types/ast.js";


export function getLiteralsByCSSAtRule(ctx: Rule.RuleContext, node: Atrule): Literal[] {

  const literals: Literal[] = [];

  if(node.name !== "apply"){ return []; }

  if(node.prelude?.type === "AtrulePrelude" || node.prelude?.type === "Raw"){
    const literal = getLiteralsByAtrule(ctx, node);
    if(literal){
      literals.push(literal);
    }
  }

  return literals;

}

/**
 * Splits the raw text of an `@apply` directive into its leading keyword, class list content and trailing semicolon.
 *
 * @param raw
 * @returns
 */
export function matchCSSApplyDirective(raw: string): undefined | { content: string; leadingApply: string; trailingSemicolon: string; } {
  const match = raw.match(/^(?<leadingApply>@apply[\t ](?!\r?\n)|@apply(?=\s))(?<content>.+?)(?<trailingSemicolon>;?\s*)$/s);

  if(!match?.groups?.leadingApply || !match.groups.content || match.groups.trailingSemicolon === undefined){
    return;
  }

  const { content, leadingApply, trailingSemicolon } = match.groups;

  return { content, leadingApply, trailingSemicolon };
}

function getLiteralsByAtrule(ctx: Rule.RuleContext, node: Atrule): CSSClassListLiteral | undefined {

  // @ts-expect-error - CSS Tree types are different
  const raw = ctx.sourceCode.getText(node);

  const match = matchCSSApplyDirective(raw);

  if(!match){
    return;
  }

  const { content, leadingApply, trailingSemicolon } = match;

  const startOffset = leadingApply.length;
  const endOffset = trailingSemicolon.length;

  const loc = getLoc(ctx, node, startOffset, endOffset);
  const range = getRange(ctx, node, startOffset, endOffset);

  if(!loc){
    return;
  }

  const line = ctx.sourceCode.lines[node.loc!.start.line - 1];
  const indentation = getIndentation(line);
  const whitespaces = getWhitespace(content);
  const type = "CSSClassListLiteral";

  return {
    ...whitespaces,
    content,
    indentation,
    isInterpolated: false,
    leadingApply,
    loc,
    range,
    raw: content,
    supportsMultiline: true,
    trailingSemicolon,
    type
  };

}

function getLoc(ctx: Rule.RuleContext, node: Atrule, startOffset: number, endOffset: number): Loc["loc"] | undefined {
  if(!node.loc){
    return;
  }

  return {
    end: {
      column: node.loc.end.column - endOffset,
      line: node.loc.end.line
    },
    start: {
      column: node.loc.start.column + startOffset,
      line: node.loc.start.line
    }
  };
}

function getRange(ctx: Rule.RuleContext, node: Atrule, startOffset: number, endOffset: number): Range["range"] {
  const range = ctx.sourceCode
    // @ts-expect-error - CSS Tree types are different
    .getRange(node);

  return [
    range[0] + startOffset,
    range[1] - endOffset
  ];
}
