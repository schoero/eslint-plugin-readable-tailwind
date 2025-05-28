import { getClassOrder } from "better-tailwindcss:async:class-order.sync.js";
import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "better-tailwindcss:options:default-options.js";
import {
  ATTRIBUTE_SCHEMA,
  CALLEE_SCHEMA,
  ENTRYPOINT_SCHEMA,
  TAG_SCHEMA,
  TAILWIND_CONFIG_SCHEMA,
  VARIABLE_SCHEMA
} from "better-tailwindcss:options:descriptions.js";
import { escapeNestedQuotes } from "better-tailwindcss:utils:quotes.js";
import { createRuleListener } from "better-tailwindcss:utils:rule.js";
import {
  augmentMessageWithWarnings,
  display,
  getCommonOptions,
  splitClasses,
  splitWhitespaces
} from "better-tailwindcss:utils:utils.js";

import type { Rule } from "eslint";

import type { Literal } from "better-tailwindcss:types:ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "better-tailwindcss:types:rule.js";
import type { Warning } from "better-tailwindcss:utils:utils.js";


export type Options = [
  Partial<
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      entryPoint?: string;
      order?: "asc" | "desc" | "improved" | "official";
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

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/sort-classes.md";

export const sortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce a consistent order for tailwind classes.",
        recommended: true,
        url: DOCUMENTATION_URL
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
            ...ENTRYPOINT_SCHEMA,
            ...TAILWIND_CONFIG_SCHEMA,
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

    const [sortedClassChunks, warnings] = sortClassNames(ctx, classChunks);

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
      literal.openingQuote ?? literal.closingQuote ?? "`"
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
      message: augmentMessageWithWarnings("Incorrect class order. Expected\n\n{{ notSorted }}\n\nto be\n\n{{ sorted }}", warnings)
    });

  }
}

function sortClassNames(ctx: Rule.RuleContext, classes: string[]): [classes: string[], warnings?: Warning[]] {

  const { order, tailwindConfig } = getOptions(ctx);

  if(order === "asc"){
    return [classes.toSorted((a, b) => a.localeCompare(b))];
  }

  if(order === "desc"){
    return [classes.toSorted((a, b) => b.localeCompare(a))];
  }

  const [classOrder, warnings] = getClassOrder({ classes, configPath: tailwindConfig, cwd: ctx.cwd });

  const sortClassesWarnings = warnings.map(warning => ({ ...warning, url: DOCUMENTATION_URL }));

  const officiallySortedClasses = classOrder
    .toSorted(([, a], [, z]) => {
      if(a === z){ return 0; }
      if(a === null){ return -1; }
      if(z === null){ return +1; }
      return +(a - z > 0n) - +(a - z < 0n);
    })
    .map(([className]) => className);

  if(order === "official"){
    return [officiallySortedClasses, sortClassesWarnings];
  }

  const groupedByVariant = new Map<string, string[]>();

  for(const className of officiallySortedClasses){
    const variant = className.match(/^.*?:/)?.[0] ?? "";
    groupedByVariant.set(variant, [...groupedByVariant.get(variant) ?? [], className]);
  }

  return [Array.from(groupedByVariant.values()).flat(), sortClassesWarnings];

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
