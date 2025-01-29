import { getClassOrder } from "readable-tailwind:async:class-order.sync.js";
import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";
import {
  ATTRIBUTE_SCHEMA,
  CALLEE_SCHEMA,
  TAG_SCHEMA,
  VARIABLE_SCHEMA
} from "readable-tailwind:options:descriptions.js";
import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";
import { createRuleListener } from "readable-tailwind:utils:rule.js";
import { display, getCommonOptions, splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";

import type { Literal } from "readable-tailwind:types:ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "readable-tailwind:types:rule.js";


export type Options = [
  Partial<
    AttributeOption
     &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      entryPoint?: string;
      order?: "asc" | "desc" | "improved" | "official" ;
      tailwindConfig?: string;
    }
  >
];

const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  order: "improved",
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

export const tailwindSortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce a consistent order for tailwind classes.",
        recommended: true,
        url: "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/sort-classes.md"
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            ...CALLEE_SCHEMA,
            ...ATTRIBUTE_SCHEMA,
            ...VARIABLE_SCHEMA,
            ...TAG_SCHEMA,
            entryPoint: {
              description: "The path to the css entry point of the project. If not specified, the plugin will fall back to the default tailwind classes.",
              type: "string"
            },
            order: {
              default: defaultOptions.order,
              description: "The algorithm to use when sorting classes.",
              enum: [
                "asc",
                "desc",
                "official",
                "improved"
              ],
              type: "string"
            },
            tailwindConfig: {
              description: "The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.",
              type: "string"
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};

function lintLiterals(ctx: Rule.RuleContext, literals: Literal[]) {

  for(const literal of literals){

    const classChunks = splitClasses(literal.content);
    const whitespaceChunks = splitWhitespaces(literal.content);

    const unsortableClasses: [string, string] = ["", ""];

    // remove sticky classes
    if(literal.closingBraces && whitespaceChunks[0] === ""){
      whitespaceChunks.shift();
      unsortableClasses[0] = classChunks.shift() ?? "";
    }
    if(literal.openingBraces && whitespaceChunks[whitespaceChunks.length - 1] === ""){
      whitespaceChunks.pop();
      unsortableClasses[1] = classChunks.pop() ?? "";
    }

    const sortedClassChunks = sortClasses(ctx, classChunks);

    const classes: string[] = [];

    for(let i = 0; i < Math.max(sortedClassChunks.length, whitespaceChunks.length); i++){
      whitespaceChunks[i] && classes.push(whitespaceChunks[i]);
      sortedClassChunks[i] && classes.push(sortedClassChunks[i]);
    }

    const escapedClasses = escapeNestedQuotes(
      [
        unsortableClasses[0],
        ...classes,
        unsortableClasses[1]
      ].join(""),
      literal.openingQuote ?? "`"
    );

    const fixedClasses =
      [
        literal.openingQuote ?? "",
        literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
        escapedClasses,
        literal.type === "TemplateLiteral" && literal.openingBraces ? literal.openingBraces : "",
        literal.closingQuote ?? ""
      ].join("");

    if(literal.raw === fixedClasses){
      continue;
    }

    ctx.report({
      data: {
        notSorted: display(literal.raw),
        sorted: display(fixedClasses)
      },
      fix(fixer) {
        return fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: "Incorrect class order. Expected\n\n{{ notSorted }}\n\nto be\n\n{{ sorted }}"
    });

  }
}

function sortClasses(ctx: Rule.RuleContext, classes: string[]): string[] {

  const { order, tailwindConfig } = getOptions(ctx);

  if(order === "asc"){
    return [...classes].sort((a, b) => a.localeCompare(b));
  }

  if(order === "desc"){
    return [...classes].sort((a, b) => b.localeCompare(a));
  }

  const officialClassOrder = getClassOrder({ classes, configPath: tailwindConfig, cwd: ctx.cwd });
  const officiallySortedClasses = [...officialClassOrder]
    .sort(([, a], [, z]) => {
      if(a === z){ return 0; }
      if(a === null){ return 1; }
      if(z === null){ return 1; }
      return +(a - z > 0n) - +(a - z < 0n);
    })
    .map(([className]) => className);

  if(order === "official"){
    return officiallySortedClasses;
  }

  return [...officiallySortedClasses].sort((a, b) => {

    const aModifier = a.match(/^.*?:/)?.[0];
    const bModifier = b.match(/^.*?:/)?.[0];

    if(aModifier && bModifier && aModifier !== bModifier){
      return aModifier.localeCompare(bModifier);
    }

    if(aModifier && !bModifier){
      return 1;
    }
    if(!aModifier && bModifier){
      return -1;
    }

    return 0;

  });

}


export function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const common = getCommonOptions(ctx);

  const order = options.order ?? defaultOptions.order;

  return {
    ...common,
    order
  };

}
