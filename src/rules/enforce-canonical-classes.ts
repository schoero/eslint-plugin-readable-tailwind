import {
  array,
  boolean,
  description,
  optional,
  pipe,
  strictObject,
  string
} from "valibot";

import { createGetCanonicalClasses, getCanonicalClasses } from "better-tailwindcss:tailwindcss/canonical-classes.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { getCachedRegex } from "better-tailwindcss:utils/regex.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { deduplicateClasses, splitClasses } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const enforceCanonicalClasses = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce canonical class names.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-canonical-classes.md",
  name: "enforce-canonical-classes",
  recommended: true,

  schema: strictObject({
    collapse: optional(
      pipe(
        boolean(),
        description("Whether to collapse multiple utilities into a single utility if possible.")
      ),
      true
    ),
    ignore: optional(
      pipe(
        array(
          string()
        ),
        description("A list of regular expression patterns for classes that should be ignored by the rule.")
      ),
      []
    ),
    logical: optional(
      pipe(
        boolean(),
        description("Whether to convert between logical and physical properties when collapsing utilities.")
      ),
      true
    )
  }),

  messages: {
    multiple: "The classes: \"{{ classNames }}\" can be simplified to \"{{canonicalClass}}\".",
    single: "The class: \"{{ className }}\" can be simplified to \"{{canonicalClass}}\"."
  },

  initialize: ctx => {
    createGetCanonicalClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});

function lintLiterals(ctx: Context<typeof enforceCanonicalClasses>, literals: Literal[]) {
  const { collapse, ignore, logical, rootFontSize } = ctx.options;
  const ignoredClassRegexes = ignore.map(ignoredClass => getCachedRegex(ignoredClass));

  for(const literal of literals){

    const classes = splitClasses(literal.content);
    const uniqueClasses = deduplicateClasses(classes);

    const filteredUniqueClasses = uniqueClasses.filter(className => !ignoredClassRegexes.some(ignoredClassRegex => ignoredClassRegex.test(className)));

    if(filteredUniqueClasses.length === 0){
      continue;
    }

    const { canonicalClasses, warnings } = getCanonicalClasses(async(ctx), filteredUniqueClasses, {
      collapse,
      logicalToPhysical: logical,
      rem: rootFontSize
    });

    lintClasses(ctx, literal, className => {
      const canonicalClass = canonicalClasses[className];

      if(!canonicalClass){
        return;
      }

      if(
        literal.utility &&
        canonicalClass.output === literal.utility
      ){
        return;
      }

      if(canonicalClass.input.length > 1){
        return {
          data: {
            canonicalClass: canonicalClasses[className].output,
            classNames: canonicalClass.input.join(", ")
          },
          fix: className === canonicalClass.input[0]
            ? canonicalClass.output
            : "",
          id: "multiple",
          warnings
        } as const;
      }

      if(canonicalClass.input.length === 1 && canonicalClass.output !== className){
        return {
          data: {
            canonicalClass: canonicalClasses[className].output,
            className: canonicalClass.input[0]
          },
          fix: canonicalClass.output,
          id: "single",
          warnings
        } as const;
      }

    });
  }
}
