import type { LiteralValueQuotes } from "better-tailwindcss:types/ast.js";


export function escapeNestedQuotes(content: string, surroundingQuotes: LiteralValueQuotes): string {
  const regex = surroundingQuotes === "'"
    ? /(?<!\\)'/g
    : surroundingQuotes === "\""
      ? /(?<!\\)"/g
      : /(?<!\\)`/g;

  return content.replace(regex, `\\${surroundingQuotes}`);
}
