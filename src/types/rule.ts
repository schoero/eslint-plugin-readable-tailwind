import type { Rule } from "eslint";


export interface ESLintRule<Options extends any[] = [any]> {
  name: string;
  rule: Rule.RuleModule;
  options?: Options;
}
