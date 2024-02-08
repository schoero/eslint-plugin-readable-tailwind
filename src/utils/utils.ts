import type { Rule } from "eslint";
import type { Literal, Node, QuoteMeta } from "src/types/ast.js";
import type { Callees } from "src/types/rule.js";


export function getWhitespace(classes: string) {

  const leadingWhitespace = classes.match(/^\s*/)?.[0];
  const trailingWhitespace = classes.match(/\s*$/)?.[0];

  return { leadingWhitespace, trailingWhitespace };

}

export function getQuotes(raw: string): QuoteMeta {
  const openingQuote = raw.at(0);
  const closingQuote = raw.at(-1);

  return {
    closingQuote: closingQuote === "'" || closingQuote === '"' || closingQuote === "`" ? closingQuote : undefined,
    openingQuote: openingQuote === "'" || openingQuote === '"' || openingQuote === "`" ? openingQuote : undefined
  };
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

export function findLiteralStartPosition(ctx: Rule.RuleContext, literal: Literal) {
  const column = literal.loc.start.column;
  return column;
}

export function isLiteral(node: Node): node is Literal {
  return node.type === "Literal";
}

// export function calleesIncludes(callees: string[], name: string): boolean {

//   for(const callee of callees){
//     if(callee.startsWith("/") && callee.endsWith("/")){
//       const regex = new RegExp(callee.slice(1, -1));
//       if(regex.test(name)){
//         return true;
//       }
//     } else if(callee === name){
//       return true;
//     }
//   }

//   return false;

// }

export function deduplicateLiterals(literals: Literal[]): Literal[] {
  return literals.filter((l1, index) => {
    return literals.findIndex(l2 => {
      return l1.content === l2.content &&
        l1.range[0] === l2.range[0] &&
        l1.range[1] === l2.range[1];
    }) === index;
  });
}

export function isValidCalleeRegex(callee: Callees[number]): callee is [string, string] {

  if(typeof callee === "object" &&
    Array.isArray(callee) &&
    // eslint-disable-next-line eslint-plugin-typescript/no-unnecessary-condition
    callee.length === 2
  ){

    try {
      new RegExp(callee[0]);
      new RegExp(callee[1]);
      return true;
    } catch {
      return false;
    }

  }

  return false;

}
