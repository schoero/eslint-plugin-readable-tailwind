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
import {
  getCommonOptions,
  getExactClassLocation,
  splitClasses,
  splitWhitespaces
} from "readable-tailwind:utils:utils.js";

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
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      allowMultiline?: boolean;
    }
  >
];

const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/no-duplicate-classes.md";

export const tailwindNoDuplicateClasses: ESLintRule<Options> = {
  name: "no-duplicate-classes" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Disallow duplicate class names in tailwind classes.",
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
            ...TAG_SCHEMA
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

    const parentClasses = literal.priorLiterals
      ? getClassesFromLiteralNodes(literal.priorLiterals)
      : [];

    const duplicates: string[] = [];

    const classes = literal.content;

    const classChunks = splitClasses(classes);
    const whitespaceChunks = splitWhitespaces(classes);

    const finalChunks: string[] = [];

    const startsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[0] !== "";
    const endsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[whitespaceChunks.length - 1] !== "";

    for(let i = 0; i < whitespaceChunks.length; i++){

      if(whitespaceChunks[i]){
        finalChunks.push(whitespaceChunks[i]);
      }

      if(classChunks[i]){

        // always push sticky classes without adding to the register
        if(
          !startsWithWhitespace && i === 0 && literal.closingBraces ||
          !endsWithWhitespace && i === classChunks.length - 1 && literal.openingBraces
        ){
          finalChunks.push(classChunks[i]);
          continue;
        }

        if(parentClasses.includes(classChunks[i])){
          if(!duplicates.includes(classChunks[i])){
            duplicates.push(classChunks[i]);
          }
        } else {
          finalChunks.push(classChunks[i]);
          parentClasses.push(classChunks[i]);
        }
      }

    }

    const escapedClasses = escapeNestedQuotes(
      finalChunks.join(""),
      literal.openingQuote ?? literal.closingQuote ?? "\""
    );

    const fixedClasses = [
      literal.openingQuote ?? "",
      literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
      escapedClasses,
      literal.type === "TemplateLiteral" && literal.openingBraces ? literal.openingBraces : "",
      literal.closingQuote ?? ""
    ].join("");

    if(literal.raw === fixedClasses){
      continue;
    }

    for(const className of duplicates){
      ctx.report({
        data: {
          duplicateClassname: className
        },
        fix(fixer) {
          return fixer.replaceTextRange(literal.range, fixedClasses);
        },
        loc: getExactClassLocation(literal, className, true),
        message: "Duplicate classname: \"{{ duplicateClassname }}\"."
      });
    }

  }

}

function getClassesFromLiteralNodes(literals: Literal[]) {
  return literals.reduce<string[]>((combinedClasses, literal) => {
    if(!literal){ return combinedClasses; }

    const classes = literal.content;
    const split = splitClasses(classes);

    for(const className of split){
      if(!combinedClasses.includes(className)){
        combinedClasses.push(className);
      }
    }

    return combinedClasses;

  }, []);
}

function getOptions(ctx: Rule.RuleContext) {
  return getCommonOptions(ctx);
}
