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
    parts.leadingQuote ?? "",
    parts.leadingBraces ?? "",
    parts.leadingWhitespace ?? "",
    ...classes,
    parts.trailingWhitespace ?? "",
    parts.trailingBraces ?? "",
    parts.trailingQuote ?? ""
  ].join("");
}

export function createParts(literal: Parts): Parts {

  const parts: Parts = {};

  if("leadingQuote" in literal){
    parts.leadingQuote = literal.leadingQuote;
    parts.trailingQuote = literal.trailingQuote;
  }

  if("leadingBraces" in literal){
    parts.leadingBraces = literal.leadingBraces;
    parts.trailingBraces = literal.trailingBraces;
  }

  return parts;

}
