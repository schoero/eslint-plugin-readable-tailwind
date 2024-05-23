import type { LiteralValueQuotes } from "readable-tailwind:types:ast.js";


export function escapeNestedQuotes(content: string, surroundingQuotes: LiteralValueQuotes): string {
  return content.replace(new RegExp(surroundingQuotes, "g"), `\\${surroundingQuotes}`);
}
