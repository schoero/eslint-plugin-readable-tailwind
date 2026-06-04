export type LiteralValueQuotes = "'" | "\"" | "`";

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
  multilineQuotes?: LiteralValueQuotes[] | undefined;
  supportsMultiline?: boolean | undefined;
  surroundingBraces?: boolean | undefined;
}

export interface WhitespaceMeta {
  leadingWhitespace?: string | undefined;
  trailingWhitespace?: string | undefined;
}

export interface QuoteMeta {
  closingQuote?: LiteralValueQuotes | undefined;
  openingQuote?: LiteralValueQuotes | undefined;
}
export interface BracesMeta {
  closingBraces?: string | undefined;
  openingBraces?: string | undefined;
}

export interface CSSMeta {
  leadingApply?: string | undefined;
  trailingSemicolon?: string | undefined;
}

export interface Indentation {
  indentation: number;
}

interface NodeBase extends Range, Loc {
  [key: PropertyKey]: unknown;
  type: string;
}

interface LiteralBase extends NodeBase, MultilineMeta, QuoteMeta, BracesMeta, WhitespaceMeta, CSSMeta, Indentation, Range, Loc {
  content: string;
  raw: string;
  attribute?: string | undefined;
  isConcatenatedLeft?: boolean | undefined;
  isConcatenatedRight?: boolean | undefined;
  isInterpolated?: boolean | undefined;
  priorLiterals?: Literal[] | undefined;
}

export interface TemplateLiteral extends LiteralBase {
  type: "TemplateLiteral";
}

export interface StringLiteral extends LiteralBase {
  type: "StringLiteral";
}

export interface CSSClassListLiteral extends LiteralBase {
  type: "CSSClassListLiteral";
  utility?: string | undefined;
}

export type Literal = CSSClassListLiteral | StringLiteral | TemplateLiteral;
