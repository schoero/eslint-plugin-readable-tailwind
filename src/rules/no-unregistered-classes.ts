import { getCustomComponentClasses } from "better-tailwindcss:async/custom-component-classes.sync.js";
import { getUnregisteredClasses } from "better-tailwindcss:async/unregistered-classes.sync.js";
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
import { getCommonOptions } from "better-tailwindcss:utils/options.js";
import { createRuleListener } from "better-tailwindcss:utils/rule.js";
import {
  augmentMessageWithWarnings,
  display,
  getExactClassLocation,
  splitClasses
} from "better-tailwindcss:utils/utils.js";

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
      detectComponentClasses?: boolean;
      entryPoint?: string;
      ignore?: string[];
      tailwindConfig?: string;
    }
  >
];

export const DEFAULT_IGNORED_UNREGISTERED_CLASSES = [
  "^group(?:\\/(\\S*))?$",
  "^peer(?:\\/(\\S*))?$"
];

const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  detectComponentClasses: false,
  ignore: DEFAULT_IGNORED_UNREGISTERED_CLASSES,
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-unregistered-classes.md";

export const noUnregisteredClasses: ESLintRule<Options> = {
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
            ...ENTRYPOINT_SCHEMA,
            ...TAILWIND_CONFIG_SCHEMA,
            detectComponentClasses: {
              default: defaultOptions.detectComponentClasses,
              description: "Whether to automatically detect custom component classes from the tailwindcss config.",
              type: "boolean"
            },
            ignore: {
              description: "A list of classes that should be ignored by the rule.",
              items: {
                type: "string"
              },
              type: "array"
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
  const { detectComponentClasses, ignore, tailwindConfig } = getOptions(ctx);

  const customComponentClasses = detectComponentClasses
    ? getCustomComponentClasses({ configPath: tailwindConfig, cwd: ctx.cwd })[0]
    : [];

  for(const literal of literals){

    const classes = splitClasses(literal.content);

    const [unregisteredClasses, warnings] = getUnregisteredClasses({ classes, configPath: tailwindConfig, cwd: ctx.cwd });

    const unregisteredClassesWarnings = warnings.map(warning => ({ ...warning, url: DOCUMENTATION_URL }));

    if(unregisteredClasses.length === 0){
      continue;
    }

    for(const unregisteredClass of unregisteredClasses){
      if(
        ignore.some(ignoredClass => unregisteredClass.match(ignoredClass)) ||
        customComponentClasses.includes(unregisteredClass)
      ){
        continue;
      }

      ctx.report({
        data: {
          unregistered: display(unregisteredClass)
        },
        loc: getExactClassLocation(literal, unregisteredClass),
        message: augmentMessageWithWarnings("Unregistered class detected: {{ unregistered }}", unregisteredClassesWarnings)
      });
    }

  }
}

export function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const common = getCommonOptions(ctx);

  const ignore = options.ignore ?? defaultOptions.ignore;
  const detectComponentClasses = options.detectComponentClasses ?? defaultOptions.detectComponentClasses;

  return {
    ...common,
    detectComponentClasses,
    ignore
  };

}
