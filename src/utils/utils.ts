import type { Rule } from "eslint";
import type { Parts } from "src/types/ast";


export function getWhitespace(ctx: Rule.RuleContext, classes: string) {

  const leadingWhitespace = classes.at(0) === " " ? " " : "";
  const trailingWhitespace = classes.at(-1) === " " ? " " : "";

  return { leadingWhitespace, trailingWhitespace };

}

export function splitClasses(ctx: Rule.RuleContext, classes: string): string[] {
  return classes
    .trim()
    .split(/\s+/);
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
    classes.join(" "),
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
