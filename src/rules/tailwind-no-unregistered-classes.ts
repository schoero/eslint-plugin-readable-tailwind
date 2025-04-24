import { getUnregisteredClasses } from "readable-tailwind:async:unregistered-classes.sync.js";
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
import { createRuleListener } from "readable-tailwind:utils:rule.js";
import { augmentMessageWithWarnings, display, getCommonOptions, splitClasses } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";

import type { Literal, Loc } from "readable-tailwind:types:ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "readable-tailwind:types:rule.js";


export type Options = [
  Partial<
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      autofix?: "remove" | false;
      entryPoint?: string;
      ignoredClasses?: string[];
      tailwindConfig?: string;
    }
  >
];

const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  autofix: false,
  callees: DEFAULT_CALLEE_NAMES,
  ignoredClasses: [],
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/no-unregistered-classes.md";

export const tailwindNoUnregisteredClasses: ESLintRule<Options> = {
  name: "no-unregistered-classes" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        description: "Disallow any css classes that are not registered in tailwindcss.",
        recommended: false,
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
            entryPoint: {
              description: "The path to the css entry point of the project. If not specified, the plugin will fall back to the default tailwind classes.",
              type: "string"
            },
            ignoredClasses: {
              description: "A list of classes that should be ignored by the rule.",
              items: {
                type: "string"
              },
              type: "array"
            },
            tailwindConfig: {
              description: "The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.",
              type: "string"
            }
          },
          type: "object"
        }
      ],
      type: "problem"
    }
  }
};

function lintLiterals(ctx: Rule.RuleContext, literals: Literal[]) {

  for(const literal of literals){

    const { autofix, ignoredClasses, tailwindConfig } = getOptions(ctx);

    const classes = splitClasses(literal.content);

    const [unregisteredClasses, warnings] = getUnregisteredClasses({ classes, configPath: tailwindConfig, cwd: ctx.cwd });

    const unregisteredClassesWarnings = warnings.map(warning => ({ ...warning, url: DOCUMENTATION_URL }));

    if(unregisteredClasses.length === 0){
      continue;
    }

    for(const unregisteredClass of unregisteredClasses){
      if(ignoredClasses.some(ignoredClass => ignoredClass.match(unregisteredClass))){
        continue;
      }

      ctx.report({
        data: {
          unregistered: display(unregisteredClass)
        },
        loc: getExactLocation(literal.loc, literal, unregisteredClass),
        message: augmentMessageWithWarnings("Unregistered class detected: {{ unregistered }}", unregisteredClassesWarnings)
      });
    }

  }
}

function getExactLocation(loc: Loc["loc"], literal: Literal, className: string) {
  const startIndex = literal.content.indexOf(className); // + (literal.openingQuote?.length ?? 0) + (literal.surroundingBraces ? 1 : 0);
  const linesUpToStartIndex = literal.content.slice(0, startIndex).split("\n");
  const isOnFirstLine = linesUpToStartIndex.length === 1;
  const containingLine = linesUpToStartIndex.at(-1);

  const line = loc.start.line + linesUpToStartIndex.length - 1;
  const column = (
    isOnFirstLine
      ? loc.start.column + (literal.openingQuote?.length ?? 0)
      : 0
  ) + (containingLine?.length ?? 0);

  return {
    end: {
      column: column + className.length,
      line
    },
    start: {
      column,
      line
    }
  };
}

export function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const common = getCommonOptions(ctx);

  const ignoredClasses = options.ignoredClasses ?? defaultOptions.ignoredClasses;
  const autofix = options.autofix ?? defaultOptions.autofix;

  return {
    ...common,
    autofix,
    ignoredClasses
  };

}
