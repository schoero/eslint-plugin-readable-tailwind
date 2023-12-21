import type { Rule } from "eslint";
import type { Node } from "src/types/ast.js";


export function getWhitespace(classes: string) {

  const leadingWhitespace = classes.match(/^\s*/)?.[0];
  const trailingWhitespace = classes.match(/\s*$/)?.[0];

  return { leadingWhitespace, trailingWhitespace };

}

export function splitClasses(classes: string): string[] {

  if(classes.trim() === ""){
    return [];
  }

  return classes
    .trim()
    .split(/\s+/);

}

export function splitWhitespaces(classes: string): string[] {
  return classes.split(/[^\s\\]+/);
}

export function findLineStartPosition(ctx: Rule.RuleContext, node: Node) {
  const line = node.loc.start.line;
  return ctx.sourceCode.lines[line - 1].match(/^\s*/)?.[0]?.length ?? 0;
}
