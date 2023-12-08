import type { Rule } from "eslint";


export function getOptions(ctx: Rule.RuleContext) {

  const options = ctx.options[0] ?? {};
  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? 5;
  const classAttributes = options.classAttributes ?? ["class", "className"];
  const sortByModifiers = options.sortByModifiers ?? true;
  const sortByPseudoElements = options.sortByPseudoElements ?? true;

  return {
    classAttributes,
    classesPerLine,
    printWidth
  };

}

export function getWhitespace(ctx: Rule.RuleContext, classes: string) {

  const leadingWhitespace = classes.match(/^\s*/)?.[0];
  const trailingWhitespace = classes.match(/\s*$/)?.[0];

  return { leadingWhitespace, trailingWhitespace };

}

export function splitClasses(ctx: Rule.RuleContext, classes: string): string[] {
  return classes
    .trim()
    .split(/\s+/);
}

export function combineClasses(
  ctx: Rule.RuleContext,
  classes: string[],
  parts: Parts
): string {
  return [
    parts.leadingQuote ?? "",
    parts.leadingBraces ?? "",
    parts.leadingWhitespace ?? "",
    classes.join(" "),
    parts.trailingWhitespace ?? "",
    parts.trailingBraces ?? "",
    parts.trailingQuote ?? ""
  ].join("");
}

export type LiteralValueQuotes = "'" | "\"" | "`";

export interface QuoteParts {
  leadingQuote?: LiteralValueQuotes;
  trailingQuote?: LiteralValueQuotes;
}

export interface BracesParts {
  leadingBraces?: string;
  trailingBraces?: string;
}

export interface WhitespaceParts {
  leadingWhitespace?: string;
  trailingWhitespace?: string;
}

export interface Parts extends QuoteParts, BracesParts, WhitespaceParts {
  raw: string;
}

interface TailwindGroup {
  kind: "group";
  value: string;
  name?: string;
}

interface TailwindModifier {
  kind: "modifier";
  value: string;
}

interface TailwindClass {
  kind: "class";
  value: string;
}

type TailwindChunk = TailwindClass | TailwindGroup | TailwindModifier;
