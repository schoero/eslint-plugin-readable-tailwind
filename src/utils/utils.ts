import type { Rule } from "eslint";
import type { Parts } from "src/types/ast";


export function getWhitespace(ctx: Rule.RuleContext, classes: string) {

  const leadingWhitespace = classes.match(/^\s*/)?.[0];
  const trailingWhitespace = classes.match(/\s*$/)?.[0];

  return { leadingWhitespace, trailingWhitespace };

}

export function splitClasses(ctx: Rule.RuleContext, classes: string): string[] {
  return classes
    .trim()
    .split(/\s+/);
}

export function splitWhitespace(ctx: Rule.RuleContext, classes: string): string[] {
  return classes.split(/[^\s\\]+/);
}

export function combineClasses(
  ctx: Rule.RuleContext,
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

interface TailwindGroup {
  kind: "group";
  value: string;
  name?: string;
}

interface TailwindModifier {
  kind: "modifier";
  value: string;
}

interface TailwindClass {
  kind: "class";
  value: string;
}

type TailwindChunk = TailwindClass | TailwindGroup | TailwindModifier;
