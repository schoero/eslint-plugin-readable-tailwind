import type { Rule } from "eslint";


export interface ReadableTailwindOptions {
  classAttributes?: string[];
  classesPerLine?: number;
  group?: "emptyLine" | "never" | "newLine" | false;
  printWidth?: number;
  sort?: "asc" | "desc" | "never" | false;
  trim?: boolean;
}


export interface ESLintRule<Options extends any[] = [any]> {
  name: string;
  rule: Rule.RuleModule;
  options?: Options;
}
