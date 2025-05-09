export type LiteralValueQuotes = "'" | "\"" | "\\`" | "`";

export interface Range {
  range: [number, number];
}

export interface Loc {
  loc: {
    end: {
      column: number;
      line: number;
    };
    start: {
      column: number;
      line: number;
    };
  };
}

export interface MultilineMeta {
  multilineQuotes?: LiteralValueQuotes[];
  supportsMultiline?: boolean;
  surroundingBraces?: boolean;
}

export interface WhitespaceMeta {
  leadingWhitespace?: string;
  trailingWhitespace?: string;
}

export interface QuoteMeta {
  closingQuote?: LiteralValueQuotes;
  openingQuote?: LiteralValueQuotes;
}
export interface BracesMeta {
  closingBraces?: string;
  openingBraces?: string;
}

export interface Indentation {
  indentation: number;
}

interface NodeBase extends Range, Loc {
  [key: PropertyKey]: unknown;
  type: string;
}

interface LiteralBase extends NodeBase, MultilineMeta, QuoteMeta, BracesMeta, WhitespaceMeta, Indentation, Range, Loc {
  content: string;
  raw: string;
  priorLiterals?: Literal[];
}

export interface TemplateLiteral extends LiteralBase {
  type: "TemplateLiteral";
}

export interface StringLiteral extends LiteralBase {
  type: "StringLiteral";
}

export type Literal = StringLiteral | TemplateLiteral;
