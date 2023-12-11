import type { Parts } from "src/types/ast";


export function getWhitespace(classes: string) {

  const leadingWhitespace = classes.match(/^\s*/)?.[0];
  const trailingWhitespace = classes.match(/\s*$/)?.[0];

  return { leadingWhitespace, trailingWhitespace };

}

export function splitClasses(classes: string): string[] {
  return classes
    .trim()
    .split(/\s+/);
}

export function splitWhitespace(classes: string): string[] {
  return classes.split(/[^\s\\]+/);
}

export function combineClasses(
  classes: string[],
  parts: Parts
): string {
  return [
    parts.openingQuote ?? "",
    parts.closingBraces ?? "",
    ...classes,
    parts.openingBraces ?? "",
    parts.closingQuote ?? ""
  ].join("");
}

export function createParts(literal: Parts): Parts {

  const parts: Parts = {};

  if("openingQuote" in literal || "closingQuote" in literal){
    parts.openingQuote = literal.openingQuote;
    parts.closingQuote = literal.closingQuote;
  }

  if("openingBraces" in literal || "closingBraces" in literal){
    parts.closingBraces = literal.closingBraces;
    parts.openingBraces = literal.openingBraces;
  }

  return parts;

}
