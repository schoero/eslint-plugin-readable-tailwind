import {
  array,
  boolean,
  description,
  optional,
  pipe,
  strictObject,
  string
} from "valibot";

import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { getCachedRegex } from "better-tailwindcss:utils/regex.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { splitClasses } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const enforceMotionSafeVariant = createRule({
  autofix: false,
  category: "correctness",
  description: "Enforce the 'motion-safe' variant for transition and animation classes.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-motion-safe-variant.md",
  name: "enforce-motion-safe-variant",
  recommended: false,

  messages: {
    missing: "{{ className }} is missing the 'motion-safe' variant."
  },

  schema: strictObject({
    allowMotionReduce: optional(
      pipe(
        boolean(),
        description("Suppress warnings for a literal that already contains a class with the 'motion-reduce' variant (in itself or in prior literals).")
      ),
      false
    ),
    classes: optional(
      pipe(
        array(string()),
        description("A list of regular expression patterns for classes that require the 'motion-safe' variant.")
      ),
      ["^transition(-.*)?$", "^animate(-.*)?$"]
    )
  }),

  initialize: ctx => {
    createGetDissectedClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});


function lintLiterals(ctx: Context<typeof enforceMotionSafeVariant>, literals: Literal[]) {
  const { allowMotionReduce, classes: classPatterns } = ctx.options;

  for(const literal of literals){
    const classes = splitClasses(literal.content);
    const { dissectedClasses, warnings } = getDissectedClasses(async(ctx), classes);

    if(allowMotionReduce && hasMotionReduceVariant(ctx, literal, dissectedClasses)){
      continue;
    }

    lintClasses(ctx, literal, className => {
      const dissectedClass = dissectedClasses[className];

      if(dissectedClass?.variants === undefined){
        return;
      }

      if(!classPatterns.some(pattern => getCachedRegex(pattern).test(dissectedClass.base))){
        return;
      }

      if(dissectedClass.variants.includes("motion-safe") || dissectedClass.variants.includes("motion-reduce")){
        return;
      }

      return {
        data: { className },
        id: "missing",
        warnings
      } as const;
    });
  }
}

function hasMotionReduceVariant(
  ctx: Context<typeof enforceMotionSafeVariant>,
  literal: Literal,
  dissectedClasses: ReturnType<typeof getDissectedClasses>["dissectedClasses"]
): boolean {
  if(hasMotionReduceInClasses(dissectedClasses)){
    return true;
  }

  if(!literal.priorLiterals){
    return false;
  }

  for(const priorLiteral of literal.priorLiterals){
    if(!priorLiteral){ continue; }

    const priorClasses = splitClasses(priorLiteral.content);
    const { dissectedClasses: priorDissectedClasses } = getDissectedClasses(async(ctx), priorClasses);

    if(hasMotionReduceInClasses(priorDissectedClasses)){
      return true;
    }
  }

  return false;
}

function hasMotionReduceInClasses(
  dissectedClasses: ReturnType<typeof getDissectedClasses>["dissectedClasses"]
): boolean {
  return Object.values(dissectedClasses).some(
    dissectedClass => dissectedClass.variants?.includes("motion-reduce")
  );
}
