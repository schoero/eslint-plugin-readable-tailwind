import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";

import type { Rule } from "eslint";

import type { Literal, Node, QuoteMeta } from "readable-tailwind:types:ast.js";


export function getCommonOptions(ctx: Rule.RuleContext) {
  const attributes = ctx.options[0]?.attributes ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.attributes ??
    ctx?.settings["readable-tailwind"]?.attributes ??
    DEFAULT_ATTRIBUTE_NAMES;

  const callees = ctx.options[0]?.callees ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.callees ??
    ctx?.settings["readable-tailwind"]?.callees ??
    DEFAULT_CALLEE_NAMES;

  const variables = ctx.options[0]?.variables ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.variables ??
    ctx?.settings["readable-tailwind"]?.variables ??
    DEFAULT_VARIABLE_NAMES;

  const tags = ctx.options[0]?.tags ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.tags ??
    ctx?.settings["readable-tailwind"]?.tags ??
    DEFAULT_TAG_NAMES;

  const tailwindConfig = ctx.options[0]?.tailwindConfig ?? ctx.options[0]?.entryPoint ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.tailwindConfig ??
    ctx?.settings["readable-tailwind"]?.tailwindConfig ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.entryPoint ??
    ctx?.settings["readable-tailwind"]?.entryPoint;

  return {
    attributes,
    callees,
    tags,
    tailwindConfig,
    variables
  };
}

export function getWhitespace(classes: string) {
  const leadingWhitespace = classes.match(/^\s*/)?.[0];
  const trailingWhitespace = classes.match(/\s*$/)?.[0];

  return { leadingWhitespace, trailingWhitespace };
}

export function getQuotes(raw: string): QuoteMeta {
  const openingQuote = raw.at(0);
  const closingQuote = raw.at(-1);

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' || closingQuote === "`" ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' || openingQuote === "`" ? openingQuote : undefined
  };
}

export function splitClasses(classes: string): string[] {

  if(classes.trim() === ""){
    return [];
  }

  return classes
    .trim()
    .split(/\s+/);

}

export function display(classes: string): string {
  return classes
    .replaceAll(" ", "·")
    .replaceAll("\n", "↵\n")
    .replaceAll("\r", "↩\r")
    .replaceAll("\t", "→");
}

export function splitWhitespaces(classes: string): string[] {
  return classes.split(/\S+/);
}

export function findLineStartPosition(ctx: Rule.RuleContext, node: Node) {
  const line = node.loc.start.line;
  return ctx.sourceCode.lines[line - 1].match(/^\s*/)?.[0]?.length ?? 0;
}

export function findLiteralStartPosition(ctx: Rule.RuleContext, literal: Literal) {
  const column = literal.loc.start.column;
  return column;
}

export function isLiteral(node: Node): node is Literal {
  return node.type === "Literal";
}

export function matchesName(pattern: string, name: string | undefined): boolean {
  if(!name){ return false; }

  return new RegExp(pattern).test(name);
}

export function deduplicateLiterals(literals: Literal[]): Literal[] {
  return literals.filter((l1, index) => {
    return literals.findIndex(l2 => {
      return l1.content === l2.content &&
        l1.range[0] === l2.range[0] &&
        l1.range[1] === l2.range[1];
    }) === index;
  });
}
