import { getCachedRegex } from "better-tailwindcss:utils/regex.js";

import type { MessageStyleOption } from "better-tailwindcss:options/schemas/common.js";
import type { BracesMeta, Literal, QuoteMeta } from "better-tailwindcss:types/ast.js";
import type { Warning } from "better-tailwindcss:types/async.js";


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

export function getContent(raw: string, quotes?: QuoteMeta, braces?: BracesMeta) {
  return raw.substring(
    (quotes?.openingQuote?.length ?? 0) + (braces?.closingBraces?.length ?? 0),
    raw.length - (quotes?.closingQuote?.length ?? 0) - (braces?.openingBraces?.length ?? 0)
  );
}

export function splitClasses(classes: string): string[] {
  if(classes.trim() === ""){
    return [];
  }

  return classes
    .trim()
    .split(/\s+/);
}

export function deduplicateClasses(classes: string[]): string[] {
  return classes.filter((className, index) => {
    return classes.indexOf(className) === index;
  });
}

export function display(messageStyle: MessageStyleOption["messageStyle"], classes: string): string {
  if(messageStyle === "raw"){
    return escapeMessage(messageStyle, classes);
  }

  return escapeMessage(
    messageStyle,
    classes
      .replaceAll(" ", "·")
      .replaceAll("\n", "↵\n")
      .replaceAll("\r", "↩\r")
      .replaceAll("\t", "→")
  );
}

/**
 * Augments a message with additional warnings and documentation links.
 *
 * @template Options
 * @param message The original message to augment.
 * @param docs The documentation URL to include.
 * @param warnings Any warnings to include in the message.
 * @returns The augmented message.
 */
export function augmentMessageWithWarnings<Options extends Record<string, any>>(message: string, docs: string, warnings?: (Warning<Options> | undefined)[]) {
  const ruleWarnings = warnings
    ?.filter(warning => !!warning)
    .map(warning => ({ ...warning, url: warning.url ?? docs }));

  if(!ruleWarnings || ruleWarnings.length === 0){
    return message;
  }

  return [
    ruleWarnings.flatMap(({ option, title, url }) => [
      `⚠️ Warning: ${title}. Option \`${option}\` may be misconfigured.`,
      `Check documentation at ${url}`
    ]).join("\n"),
    message
  ].join("\n\n");
}

export function escapeMessage(messageStyle: MessageStyleOption["messageStyle"], message: string): string {
  if(messageStyle === "compact"){
    return message
      .replaceAll("\r", "")
      .replaceAll("\n", "");
  }

  return message;
}

export function splitWhitespaces(classes: string): string[] {
  return classes.split(/\S+/);
}

export function getIndentation(line: string): number {
  return line.match(/^[\t ]*/)?.[0].length ?? 0;
}

export function isClassSticky(literal: Literal, classIndex: number): boolean {
  const classes = literal.content;

  const classChunks = splitClasses(classes);
  const whitespaceChunks = splitWhitespaces(classes);

  const startsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[0] !== "";
  const endsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[whitespaceChunks.length - 1] !== "";

  return (
    !startsWithWhitespace && classIndex === 0 && !!literal.closingBraces ||
    !endsWithWhitespace && classIndex === classChunks.length - 1 && !!literal.openingBraces
  );
}

export function isConcatenatedClass(literal: Literal, classIndex: number): boolean {
  if(!isConcatenatedLiteral(literal)){
    return false;
  }

  const classes = literal.content;

  const classChunks = splitClasses(classes);
  const whitespaceChunks = splitWhitespaces(classes);

  const startsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[0] !== "";
  const endsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[whitespaceChunks.length - 1] !== "";

  const isFirstClass = classIndex === 0;
  const isLastClass = classIndex === classChunks.length - 1;

  const isConcatenatedOnLeft =
    literal.isConcatenatedLeft === true ||
    literal.closingBraces !== undefined;

  const isConcatenatedOnRight =
    literal.isConcatenatedRight === true ||
    literal.openingBraces !== undefined;

  return (
    !startsWithWhitespace && isFirstClass && isConcatenatedOnLeft ||
    !endsWithWhitespace && isLastClass && isConcatenatedOnRight
  );
}

export function isConcatenatedLiteral(literal: Literal) {
  const isTemplateInterpolation =
    literal.isInterpolated === true &&
    literal.openingBraces !== undefined;

  const isStringConcatenation =
    literal.isConcatenatedLeft === true ||
    literal.isConcatenatedRight === true;

  return isTemplateInterpolation || isStringConcatenation;
}

export function getExactClassLocation(literal: Literal, startIndex: number, endIndex: number) {
  const linesUpToStartIndex = literal.content.slice(0, startIndex).split(/\r?\n/);
  const isOnFirstLine = linesUpToStartIndex.length === 1;
  const containingLine = linesUpToStartIndex.at(-1);

  const line = literal.loc.start.line + linesUpToStartIndex.length - 1;
  const column = (
    isOnFirstLine
      ? literal.loc.start.column + (literal.openingQuote?.length ?? 0) + (literal.closingBraces?.length ?? 0)
      : 0
  ) + (containingLine?.length ?? 0);

  return {
    end: {
      column: column + (endIndex - startIndex),
      line
    },
    start: {
      column,
      line
    }
  };
}

export function matchesName(pattern: string, name: string | undefined): boolean {
  if(!name){ return false; }

  const match = getCachedRegex(pattern).exec(name);
  return !!match && match[0] === name;
}

export function replacePlaceholders(template: string, match: RegExpMatchArray | string[]): string {
  return template.replace(getCachedRegex(/\$(\d+)/g), (_, groupIndex) => {
    const index = Number(groupIndex);
    return match[index] ?? "";
  });
}

export function addAttribute(name: string | undefined): (literal: Literal, index: number, literals: Literal[]) => Literal {
  return (literal: Literal) => {
    if(!name){
      return literal;
    }

    literal.attribute = name;
    return literal;
  };
}

export function deduplicateLiterals(literal: Literal, index: number, literals: Literal[]): boolean {
  return literals.findIndex(l2 => {
    return literal.content === l2.content &&
      literal.range[0] === l2.range[0] &&
      literal.range[1] === l2.range[1];
  }) === index;
}

export function createObjectPathElement(path?: string): string {
  if(!path){ return ""; }

  return getCachedRegex(/^[A-Z_a-z]\w*$/).test(path)
    ? path
    : `["${path}"]`;
}

export interface GenericNodeWithParent {
  parent: Partial<GenericNodeWithParent>;
}

export function isGenericNodeWithParent(node: unknown): node is GenericNodeWithParent {
  return (
    typeof node === "object" &&
    node !== null &&
    "parent" in node &&
    node.parent !== null &&
    typeof node.parent === "object"
  );
}
