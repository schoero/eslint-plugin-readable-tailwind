import { array, description, optional, pipe, strictObject, string } from "valibot";

import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { createGetUnknownClasses, getUnknownClasses } from "better-tailwindcss:tailwindcss/unknown-classes.js";
import { buildClass } from "better-tailwindcss:utils/class.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { getCachedRegex } from "better-tailwindcss:utils/regex.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { replacePlaceholders, splitClasses } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const enforceLogicalProperties = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce logical property class names instead of physical directions.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-logical-properties.md",
  name: "enforce-logical-properties",
  recommended: false,

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

  messages: {
    multiple: "Physical class detected. Replace \"{{ className }}\" with logical classes \"{{fix}}\".",
    single: "Physical class detected. Replace \"{{ className }}\" with logical class \"{{fix}}\"."
  },

  initialize: ctx => {
    createGetDissectedClasses(ctx);
    createGetUnknownClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});

const mappings = [
  [/^pl-(.*)$/, "ps-$1"],
  [/^pr-(.*)$/, "pe-$1"],
  [/^pt-(.*)$/, "pbs-$1"],
  [/^pb-(.*)$/, "pbe-$1"],
  [/^ml-(.*)$/, "ms-$1"],
  [/^mr-(.*)$/, "me-$1"],
  [/^mt-(.*)$/, "mbs-$1"],
  [/^mb-(.*)$/, "mbe-$1"],
  [/^scroll-ml-(.*)$/, "scroll-ms-$1"],
  [/^scroll-mr-(.*)$/, "scroll-me-$1"],
  [/^scroll-pl-(.*)$/, "scroll-ps-$1"],
  [/^scroll-pr-(.*)$/, "scroll-pe-$1"],
  [/^scroll-mt-(.*)$/, "scroll-mbs-$1"],
  [/^scroll-mb-(.*)$/, "scroll-mbe-$1"],
  [/^scroll-pt-(.*)$/, "scroll-pbs-$1"],
  [/^scroll-pb-(.*)$/, "scroll-pbe-$1"],

  [/^left-(.*)$/, "inset-s-$1"],
  [/^right-(.*)$/, "inset-e-$1"],
  [/^top-(.*)$/, "inset-bs-$1"],
  [/^bottom-(.*)$/, "inset-be-$1"],

  [/^border-l$/, "border-s"],
  [/^border-l-(.*)$/, "border-s-$1"],
  [/^border-r$/, "border-e"],
  [/^border-r-(.*)$/, "border-e-$1"],
  [/^border-t$/, "border-bs"],
  [/^border-t-(.*)$/, "border-bs-$1"],
  [/^border-b$/, "border-be"],
  [/^border-b-(.*)$/, "border-be-$1"],

  [/^rounded-l$/, "rounded-s"],
  [/^rounded-l-(.*)$/, "rounded-s-$1"],
  [/^rounded-r$/, "rounded-e"],
  [/^rounded-r-(.*)$/, "rounded-e-$1"],

  [/^rounded-tl$/, "rounded-ss"],
  [/^rounded-tl-(.*)$/, "rounded-ss-$1"],
  [/^rounded-tr$/, "rounded-se"],
  [/^rounded-tr-(.*)$/, "rounded-se-$1"],
  [/^rounded-br$/, "rounded-ee"],
  [/^rounded-br-(.*)$/, "rounded-ee-$1"],
  [/^rounded-bl$/, "rounded-es"],
  [/^rounded-bl-(.*)$/, "rounded-es-$1"],

  [/^text-left$/, "text-start"],
  [/^text-right$/, "text-end"],

  [/^float-left$/, "float-start"],
  [/^float-right$/, "float-end"],
  [/^clear-left$/, "clear-start"],
  [/^clear-right$/, "clear-end"],

  [/^h-(.*)$/, "block-$1"],
  [/^w-(.*)$/, "inline-$1"],
  [/^min-h-(.*)$/, "min-block-$1"],
  [/^min-w-(.*)$/, "min-inline-$1"],
  [/^max-h-(.*)$/, "max-block-$1"],
  [/^max-w-(.*)$/, "max-inline-$1"],
  [/^size-(.*)$/, ["block-$1", "inline-$1"]]
] satisfies [before: RegExp, after: string[] | string][];


function lintLiterals(ctx: Context<typeof enforceLogicalProperties>, literals: Literal[]) {
  const { ignore } = ctx.options;
  const ignoredClassRegexes = ignore.map(ignoredClass => getCachedRegex(ignoredClass));

  for(const literal of literals){
    const classes = splitClasses(literal.content);

    const { dissectedClasses, warnings } = getDissectedClasses(async(ctx), classes);

    const possibleFixes = Object.values(dissectedClasses).flatMap(dissectedClass => {
      const replacementBases = getReplacementBases(dissectedClass.base);

      if(!replacementBases){
        return [];
      }

      return replacementBases.map(base => buildClass(ctx, { ...dissectedClass, base }));
    });

    const { unknownClasses } = getUnknownClasses(async(ctx), possibleFixes);

    lintClasses(ctx, literal, className => {
      if(ignoredClassRegexes.some(ignoredClassRegex => ignoredClassRegex.test(className))){
        return;
      }

      const dissectedClass = dissectedClasses[className];

      if(!dissectedClass){
        return;
      }

      const replacementBases = getReplacementBases(dissectedClass.base);

      if(!replacementBases){
        return;
      }

      const fixClasses = replacementBases.map(base => buildClass(ctx, { ...dissectedClass, base }));
      const hasUnknownFix = fixClasses.some(fixClass => unknownClasses.includes(fixClass));

      if(hasUnknownFix){
        return;
      }

      const fix = fixClasses.join(" ");
      const id = fixClasses.length > 1 ? "multiple" : "single";

      return {
        data: {
          className,
          fix
        },
        fix,
        id,
        warnings
      } as const;
    });
  }
}

function getReplacementBases(base: string): string[] | undefined {
  for(const [pattern, replacement] of mappings){
    const match = base.match(pattern);

    if(!match){
      continue;
    }

    return Array.isArray(replacement)
      ? replacement.map(part => replacePlaceholders(part, match))
      : [replacePlaceholders(replacement, match)];
  }
}
