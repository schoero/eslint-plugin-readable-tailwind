import type { Rule } from "eslint";


export function getOptions<Options extends [Record<string, any>]>(ctx: Rule.RuleContext): Required<Options[0]> {
  return ctx.options[0];
}
