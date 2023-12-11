export type LiteralValueQuotes = "'" | "\"" | "`";

export interface QuoteParts {
  closingQuote?: LiteralValueQuotes;
  openingQuote?: LiteralValueQuotes;
}
export interface BracesParts {
  closingBraces?: string;
  openingBraces?: string;
}

export interface Parts extends QuoteParts, BracesParts {
}
