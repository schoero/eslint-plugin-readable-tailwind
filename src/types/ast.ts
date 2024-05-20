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

export interface Meta extends QuoteMeta, BracesMeta, WhitespaceMeta {
  indentation?: string;
}

interface NodeBase extends Range, Loc {
  [key: PropertyKey]: unknown;
  type: string;
}

export interface Node extends NodeBase {
  parent: Node;
}

interface LiteralBase extends NodeBase, Meta, Range, Loc {
  content: string;
  node: Node;
  raw: string;
}

export interface TemplateLiteral extends LiteralBase, Node {
  type: "TemplateLiteral";
}

export interface StringLiteral extends LiteralBase, Node {
  type: "StringLiteral";
}

export type Literal = StringLiteral | TemplateLiteral;
