import { createRequire } from "node:module";
import { resolve as nodeResolve } from "node:path";

import type { Rule } from "eslint";

import type { Literal, Node, QuoteMeta } from "readable-tailwind:types:ast.js";


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

export function splitWhitespaces(classes: string): string[] {
  return classes.split(/[^\s\\]+/);
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

export function deduplicateLiterals(literals: Literal[]): Literal[] {
  return literals.filter((l1, index) => {
    return literals.findIndex(l2 => {
      return l1.content === l2.content &&
        l1.range[0] === l2.range[0] &&
        l1.range[1] === l2.range[1];
    }) === index;
  });
}

export function parseSemanticVersion(version: string): { major: number; minor: number; patch: number; identifier?: string; } {
  const [major, minor, patchString] = version.split(".");
  const [patch, identifier] = patchString.split("-");

  return { identifier, major: +major, minor: +minor, patch: +patch };
}

export function resolve(cwd: string, path: string): string | undefined {
  try {
    const customRequire = createRequire(import.meta.url);
    return customRequire.resolve(path, { paths: [cwd] });
  } catch {
    return nodeResolve(cwd, path);
  }
}
