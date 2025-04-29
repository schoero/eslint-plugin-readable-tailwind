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
  allowMultiline: true,
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/no-unnecessary-whitespace.md";

export const tailwindNoUnnecessaryWhitespace: ESLintRule<Options> = {
  name: "no-unnecessary-whitespace" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Disallow unnecessary whitespace in tailwind classes.",
        recommended: true,
        url: DOCUMENTATION_URL
      },
      fixable: "whitespace",
      schema: [
        {
          additionalProperties: false,
          properties: {
            allowMultiline: {
              default: defaultOptions.allowMultiline,
              description: "Allow multi-line class declarations. If this option is disabled, template literal strings will be collapsed into a single line string wherever possible. Must be set to `true` when used in combination with [readable-tailwind/multiline](./multiline.md).",
              type: "boolean"
            },
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

  const { allowMultiline } = getOptions(ctx);

  for(const literal of literals){

    const classes = splitClassesKeepWhitespace(literal, allowMultiline);

    const escapedClasses = escapeNestedQuotes(
      classes.join(""),
      literal.openingQuote ?? literal.closingQuote ?? "`"
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

    ctx.report({
      data: {
        fixedClasses: display(fixedClasses),
        unnecessaryWhitespace: display(literal.raw)
      },
      fix(fixer) {
        return fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: "Unnecessary whitespace. Expected\n\n{{ unnecessaryWhitespace }}\n\nto be\n\n{{ fixedClasses }}"
    });

  }

}

function splitClassesKeepWhitespace(literal: Literal, allowMultiline: boolean): string[] {

  const classes = literal.content;

  const classChunks = splitClasses(classes);
  const whitespaceChunks = splitWhitespaces(classes);

  const mixedChunks: string[] = [];

  if(classChunks.length === 0 && !literal.closingBraces && !literal.openingBraces){
    return [];
  }

  while(whitespaceChunks.length > 0 || classChunks.length > 0){

    const whitespaceChunk = whitespaceChunks.shift();
    const classChunk = classChunks.shift();

    const isFirstChunk = mixedChunks.length === 0;
    const isLastChunk = whitespaceChunks.length === 0 && classChunks.length === 0;

    if(whitespaceChunk){
      if(whitespaceChunk.includes("\n") && allowMultiline === true){
        const whitespaceWithoutLeadingSpaces = whitespaceChunk.replace(/^ +/, "");
        mixedChunks.push(whitespaceWithoutLeadingSpaces);
      } else {
        if(!isFirstChunk && !isLastChunk ||
          literal.type === "TemplateLiteral" && literal.closingBraces && isFirstChunk && !isLastChunk ||
          literal.type === "TemplateLiteral" && literal.openingBraces && isLastChunk && !isFirstChunk){
          mixedChunks.push(" ");
        }
      }
    }

    if(classChunk){
      mixedChunks.push(classChunk);
    }

  }

  return mixedChunks;

}

function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const common = getCommonOptions(ctx);

  const allowMultiline = options.allowMultiline ?? defaultOptions.allowMultiline;

  return {
    ...common,
    allowMultiline
  };

}
