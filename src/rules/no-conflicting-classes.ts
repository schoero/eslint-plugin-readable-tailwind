import { getConflictingClasses } from "better-tailwindcss:async/conflicting-classes.sync.js";
import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "better-tailwindcss:options/default-options.js";
import {
  ATTRIBUTE_SCHEMA,
  CALLEE_SCHEMA,
  ENTRYPOINT_SCHEMA,
  TAG_SCHEMA,
  TAILWIND_CONFIG_SCHEMA,
  VARIABLE_SCHEMA
} from "better-tailwindcss:options/descriptions.js";
import { createRuleListener } from "better-tailwindcss:utils/rule.js";
import {
  augmentMessageWithWarnings,
  display,
  getExactClassLocation,
  splitClasses
} from "better-tailwindcss:utils/utils.js";
import { getCommonOptions } from "better-tailwindcss:utils/options";

import type { Rule } from "eslint";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "better-tailwindcss:types/rule.js";


export type Options = [
  Partial<
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      entryPoint?: string;
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

export const noConflictingClasses: ESLintRule<Options> = {
  name: "no-conflicting-classes" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        description: "Disallow classes that produce conflicting styles.",
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

    const [conflictingClasses, warnings] = getConflictingClasses({ classes, configPath: tailwindConfig, cwd: ctx.cwd });

    const conflictingClassesWarnings = warnings.map(warning => ({ ...warning, url: DOCUMENTATION_URL }));

    if(Object.keys(conflictingClasses).length === 0){
      continue;
    }

    for(const conflictingClass in conflictingClasses){
      const conflicts = conflictingClasses[conflictingClass];

      const otherConflicts = conflicts.filter(conflict => conflict.tailwindClassName !== conflictingClass);
      const conflict = conflicts.find(conflict => conflict.tailwindClassName === conflictingClass);

      if(!conflict || otherConflicts.length === 0){
        continue;
      }

      ctx.report({
        data: {
          conflicting: display(conflict.tailwindClassName),
          other: otherConflicts.reduce<string[]>((otherConflicts, otherConflict) => {
            if(otherConflict.tailwindClassName !== conflict.tailwindClassName){
              otherConflicts.push(`${otherConflict.tailwindClassName} -> (${otherConflict.cssPropertyName}: ${otherConflict.cssPropertyValue})`);
            }
            return otherConflicts;
          }, []).join(", "),
          property: conflict.cssPropertyName,
          value: conflict.cssPropertyValue ?? ""
        },
        loc: getExactClassLocation(literal, conflict.tailwindClassName),
        message: augmentMessageWithWarnings("Conflicting class detected: {{ conflicting }} -> ({{property}}: {{value}}) applies the same css property as {{ other }}", conflictingClassesWarnings)
      });
    }

  }
}

export function getOptions(ctx: Rule.RuleContext) {
  return getCommonOptions(ctx);
}
