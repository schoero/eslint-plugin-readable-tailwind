export interface ReadableTailwindOptions {
  classAttributes?: string[];
  classesPerLine?: number;
  group?: "emptyLine" | "never" | "newLine" | false;
  printWidth?: number;
  sort?: "asc" | "desc" | "never" | false;
  trim?: boolean;
}


export type JSXNoAttributeExpressionOptions = "always" | "as-needed";


export type RuleOptions = {
  "jsx-attribute-expression": [JSXNoAttributeExpressionOptions];
  "readable-tailwind": [ReadableTailwindOptions];
};
