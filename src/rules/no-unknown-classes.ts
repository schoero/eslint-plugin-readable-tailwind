import { array, description, optional, pipe, strictObject, string } from "valibot";

import {
  createGetCustomComponentClasses,
  getCustomComponentClasses
} from "better-tailwindcss:tailwindcss/custom-component-classes.js";
import { createGetPrefix, getPrefix } from "better-tailwindcss:tailwindcss/prefix.js";
import { createGetUnknownClasses, getUnknownClasses } from "better-tailwindcss:tailwindcss/unknown-classes.js";
import { async } from "better-tailwindcss:utils/context.js";
import { escapeForRegex } from "better-tailwindcss:utils/escape.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { getCachedRegex } from "better-tailwindcss:utils/regex.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { isConcatenatedLiteral, splitClasses } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const noUnknownClasses = createRule({
  autofix: true,
  category: "correctness",
  description: "Disallow any css classes that are not registered in tailwindcss.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-unknown-classes.md",
  name: "no-unknown-classes",
  recommended: true,

  messages: {
    unknown: "Unknown class detected: {{ className }}"
  },

  schema: strictObject({
    ignore: optional(
      pipe(
        array(
          string()
        ),
        description("A list of regular expression patterns for classes that should be ignored by the rule.")
      ),
      []
    )
  }),

  initialize: ctx => {
    const { detectComponentClasses } = ctx.options;

    createGetPrefix(ctx);
    createGetUnknownClasses(ctx);

    if(detectComponentClasses){
      createGetCustomComponentClasses(ctx);
    }
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});


function lintLiterals(ctx: Context<typeof noUnknownClasses>, literals: Literal[]) {

  const { ignore } = ctx.options;

  const { prefix, suffix } = getPrefix(async(ctx));

  const ignoredGroups = getCachedRegex(`^${escapeForRegex(`${prefix}${suffix}`)}group(?:\\/(\\S*))?$`);
  const ignoredPeers = getCachedRegex(`^${escapeForRegex(`${prefix}${suffix}`)}peer(?:\\/(\\S*))?$`);

  const customComponentClassRegexes = getCustomComponentClassRegexes(ctx);

  for(const literal of literals){

    if(isConcatenatedLiteral(literal)){
      continue;
    }

    const classes = splitClasses(literal.content);

    const { unknownClasses, warnings } = getUnknownClasses(async(ctx), classes);

    if(unknownClasses.length === 0){
      continue;
    }

    lintClasses(ctx, literal, className => {

      if(!unknownClasses.includes(className)){
        return;
      }

      if(
        ignore.some(ignoredClass => getCachedRegex(ignoredClass).test(className)) ||
        customComponentClassRegexes?.some(customComponentClassesRegex => customComponentClassesRegex.test(className)) ||
        ignoredGroups.test(className) ||
        ignoredPeers.test(className)
      ){
        return;
      }

      return {
        data: {
          className
        },
        id: "unknown",
        warnings
      } as const;

    });
  }
}

function getCustomComponentClassRegexes(ctx: Context<typeof noUnknownClasses>): RegExp[] | undefined {
  const { detectComponentClasses } = ctx.options;

  if(!detectComponentClasses){
    return;
  }

  const { customComponentClasses } = getCustomComponentClasses(async(ctx));
  const { prefix, suffix } = getPrefix(async(ctx));

  return customComponentClasses.map(className => getCachedRegex(`^${escapeForRegex(`${prefix}${suffix}`)}(?:.*:)?${escapeForRegex(className)}$`));
}
