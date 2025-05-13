import { getConflictingClasses } from "better-tailwindcss:async:conflicting-classes.sync.js";
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
import { createRuleListener } from "better-tailwindcss:utils:rule.js";
import {
  augmentMessageWithWarnings,
  display,
  escapeForRegex,
  getCommonOptions,
  splitClasses
} from "better-tailwindcss:utils:utils.js";

import type { Rule } from "eslint";

import type { Literal, Loc } from "better-tailwindcss:types:ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "better-tailwindcss:types:rule.js";


export type Options = [
  Partial<
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      entryPoint?: string;
      ignore?: string[];
      tailwindConfig?: string;
    }
  >
];


const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-conflicting-classes.md";

export const tailwindNoConflictingClasses: ESLintRule<Options> = {
  name: "no-conflicting-classes" as const,
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
            ...ENTRYPOINT_SCHEMA,
            ...TAILWIND_CONFIG_SCHEMA
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

    const { tailwindConfig } = getOptions(ctx);

    const classes = splitClasses(literal.content);

    const [conflictingCssPropertyPaths, warnings] = getConflictingClasses({ classes, configPath: tailwindConfig, cwd: ctx.cwd });

    const conflictingClassesWarnings = warnings.map(warning => ({ ...warning, url: DOCUMENTATION_URL }));

    if(Object.keys(conflictingCssPropertyPaths).length === 0){
      continue;
    }

    for(const conflictingCssPropertyPath in conflictingCssPropertyPaths){
      const conflictingClasses = conflictingCssPropertyPaths[conflictingCssPropertyPath];

      for(const conflictingClass of conflictingClasses){
        ctx.report({
          data: {
            conflicting: display(conflictingClass.tailwindClassName),
            other: conflictingClasses.reduce<string[]>((conflictingClasses, otherClass) => {
              if(otherClass.tailwindClassName !== conflictingClass.tailwindClassName){
                conflictingClasses.push(`${otherClass.tailwindClassName} -> (${otherClass.cssPropertyName}: ${otherClass.cssPropertyValue})`);
              }
              return conflictingClasses;
            }, []).join(", "),
            property: conflictingClass.cssPropertyName,
            value: conflictingClass.cssPropertyValue ?? ""
          },
          loc: getExactLocation(literal.loc, literal, conflictingClass.tailwindClassName),
          message: augmentMessageWithWarnings("Conflicting class detected: {{ conflicting }} -> ({{property}}: {{value}}) applies the same css property as {{ other }}", conflictingClassesWarnings)
        });
      }
    }

  }
}

function getExactLocation(loc: Loc["loc"], literal: Literal, className: string) {
  const escapedClass = escapeForRegex(className);
  const regex = new RegExp(`(?:^|\\s+)(${escapedClass})(?=\\s+|$)`);
  const match = literal.content.match(regex);

  if(match?.index === undefined){
    return loc;
  }

  const fullMatchIndex = match.index;
  const word = match?.[1];
  const indexOfClass = fullMatchIndex + match[0].indexOf(word);

  const linesUpToStartIndex = literal.content.slice(0, indexOfClass).split("\n");
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

  return {
    ...common
  };

}
