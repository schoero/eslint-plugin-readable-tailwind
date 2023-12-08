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
}
