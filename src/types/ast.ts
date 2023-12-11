export type LiteralValueQuotes = "'" | "\"" | "`";

export interface QuoteMeta {
  closingQuote?: LiteralValueQuotes;
  openingQuote?: LiteralValueQuotes;
}
export interface BracesMeta {
  closingBraces?: string;
  openingBraces?: string;
}

export interface Meta extends QuoteMeta, BracesMeta {
  indentation?: string;
}
