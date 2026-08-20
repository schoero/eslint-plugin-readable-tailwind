import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { createGetUnknownClasses, getUnknownClasses } from "better-tailwindcss:tailwindcss/unknown-classes.js";
import { buildClass } from "better-tailwindcss:utils/class.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { replacePlaceholders, splitClasses } from "better-tailwindcss:utils/utils.js";

import type { DissectedClass, DissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const enforceShorthandClasses = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce shorthand class names instead of longhand class names.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-shorthand-classes.md",
  name: "enforce-shorthand-classes",
  recommended: false,

  messages: {
    longhand: "Non shorthand class detected. Expected {{ longhands }} to be {{ shorthands }}",
    unnecessary: "Unnecessary whitespace"
  },

  initialize: ctx => {
    createGetDissectedClasses(ctx);
    createGetUnknownClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});


export type Shorthands = [RegExp[], string[]][][];

export const shorthands = [
  [
    [[/^w-(.*)$/, /^h-(.*)$/], ["size-$1"]]
  ],
  [
    [[/^ml-(.*)$/, /^mr-(.*)$/, /^mt-(.*)$/, /^mb-(.*)$/], ["m-$1"]],
    [[/^mx-(.*)$/, /^my-(.*)$/], ["m-$1"]],
    [[/^ms-(.*)$/, /^me-(.*)$/], ["mx-$1"]],
    [[/^ml-(.*)$/, /^mr-(.*)$/], ["mx-$1"]],
    [[/^mt-(.*)$/, /^mb-(.*)$/], ["my-$1"]]
  ],
  [
    [[/^pl-(.*)$/, /^pr-(.*)$/, /^pt-(.*)$/, /^pb-(.*)$/], ["p-$1"]],
    [[/^px-(.*)$/, /^py-(.*)$/], ["p-$1"]],
    [[/^ps-(.*)$/, /^pe-(.*)$/], ["px-$1"]],
    [[/^pl-(.*)$/, /^pr-(.*)$/], ["px-$1"]],
    [[/^pt-(.*)$/, /^pb-(.*)$/], ["py-$1"]]
  ],
  [
    [[/^border-t-(.*)$/, /^border-b-(.*)$/, /^border-l-(.*)$/, /^border-r-(.*)$/], ["border-$1"]],
    [[/^border-x-(.*)$/, /^border-y-(.*)$/], ["border-$1"]],
    [[/^border-s-(.*)$/, /^border-e-(.*)$/], ["border-x-$1"]],
    [[/^border-l-(.*)$/, /^border-r-(.*)$/], ["border-x-$1"]],
    [[/^border-t-(.*)$/, /^border-b-(.*)$/], ["border-y-$1"]]
  ],
  [
    [[/^border-spacing-x-(.*)$/, /^border-spacing-y-(.*)$/], ["border-spacing-$1"]]
  ],
  [
    [[/^rounded-tl-(.*)$/, /^rounded-tr-(.*)$/, /^rounded-bl-(.*)$/, /^rounded-br-(.*)$/], ["rounded-$1"]],
    [[/^rounded-t-(.*)$/, /^rounded-b-(.*)$/], ["rounded-$1"]],
    [[/^rounded-l-(.*)$/, /^rounded-r-(.*)$/], ["rounded-$1"]],
    [[/^rounded-tl-(.*)$/, /^rounded-tr-(.*)$/], ["rounded-t-$1"]],
    [[/^rounded-bl-(.*)$/, /^rounded-br-(.*)$/], ["rounded-b-$1"]],
    [[/^rounded-tl-(.*)$/, /^rounded-bl-(.*)$/], ["rounded-l-$1"]],
    [[/^rounded-tr-(.*)$/, /^rounded-br-(.*)$/], ["rounded-r-$1"]]
  ],
  [
    [[/^scroll-mt-(.*)$/, /^scroll-mb-(.*)$/, /^scroll-ml-(.*)$/, /^scroll-mr-(.*)$/], ["scroll-m-$1"]],
    [[/^scroll-mx-(.*)$/, /^scroll-my-(.*)$/], ["scroll-m-$1"]],
    [[/^scroll-ms-(.*)$/, /^scroll-me-(.*)$/], ["scroll-mx-$1"]],
    [[/^scroll-ml-(.*)$/, /^scroll-mr-(.*)$/], ["scroll-mx-$1"]],
    [[/^scroll-mt-(.*)$/, /^scroll-mb-(.*)$/], ["scroll-my-$1"]]
  ],
  [
    [[/^scroll-pt-(.*)$/, /^scroll-pb-(.*)$/, /^scroll-pl-(.*)$/, /^scroll-pr-(.*)$/], ["scroll-p-$1"]],
    [[/^scroll-px-(.*)$/, /^scroll-py-(.*)$/], ["scroll-p-$1"]],
    [[/^scroll-pl-(.*)$/, /^scroll-pr-(.*)$/], ["scroll-px-$1"]],
    [[/^scroll-ps-(.*)$/, /^scroll-pe-(.*)$/], ["scroll-px-$1"]],
    [[/^scroll-pt-(.*)$/, /^scroll-pb-(.*)$/], ["scroll-py-$1"]]
  ],
  [
    [[/^top-(.*)$/, /^right-(.*)$/, /^bottom-(.*)$/, /^left-(.*)$/], ["inset-$1"]],
    [[/^inset-x-(.*)$/, /^inset-y-(.*)$/], ["inset-$1"]]
  ],
  [
    [[/^divide-x-(.*)$/, /^divide-y-(.*)$/], ["divide-$1"]]
  ],
  [
    [[/^space-x-(.*)$/, /^space-y-(.*)$/], ["space-$1"]]
  ],
  [
    [[/^gap-x-(.*)$/, /^gap-y-(.*)$/], ["gap-$1"]]
  ],
  [
    [[/^translate-x-(.*)$/, /^translate-y-(.*)$/], ["translate-$1"]]
  ],
  [
    [[/^rotate-x-(.*)$/, /^rotate-y-(.*)$/], ["rotate-$1"]]
  ],
  [
    [[/^skew-x-(.*)$/, /^skew-y-(.*)$/], ["skew-$1"]]
  ],
  [
    [[/^scale-x-(.*)$/, /^scale-y-(.*)$/, /^scale-z-(.*)$/], ["scale-$1", "scale-3d"]],
    [[/^scale-x-(.*)$/, /^scale-y-(.*)$/], ["scale-$1"]]
  ],
  [
    [[/^content-(.*)$/, /^justify-content-(.*)$/], ["place-content-$1"]],
    [[/^items-(.*)$/, /^justify-items-(.*)$/], ["place-items-$1"]],
    [[/^self-(.*)$/, /^justify-self-(.*)$/], ["place-self-$1"]]
  ],
  [
    [[/^overflow-hidden/, /^text-ellipsis/, /^whitespace-nowrap/], ["truncate"]]
  ]
] satisfies Shorthands;


function lintLiterals(ctx: Context<typeof enforceShorthandClasses>, literals: Literal[]) {
  const asyncCtx = async(ctx);

  for(const literal of literals){

    const classes = splitClasses(literal.content);
    const { dissectedClasses, warnings } = getDissectedClasses(asyncCtx, classes);

    const shorthandGroups = getShorthands(ctx, dissectedClasses);

    const { unknownClasses } = getUnknownClasses(
      asyncCtx,
      shorthandGroups
        .flat()
        .flatMap(([, shorthands]) => shorthands)
        .flat()
    );


    lintClasses(ctx, literal, (className, index, after) => {
      for(const shorthandGroup of shorthandGroups){
        for(const [longhands, shorthands] of shorthandGroup){

          const longhandClasses = longhands.map(longhand => buildClass(ctx, longhand));

          if(!longhandClasses.includes(className)){
            continue;
          }

          if(shorthands.some(shorthand => unknownClasses.includes(shorthand))){
            continue;
          }

          if(shorthands.every(shorthand => after.includes(shorthand))){
            return {
              fix: "",
              id: "unnecessary"
            } as const;
          }

          return {
            data: {
              longhands: longhandClasses.join(" "),
              shorthands: shorthands.join(" ")
            },
            fix: shorthands.filter(shorthand => !after.includes(shorthand)).join(" "),
            id: "longhand",
            warnings
          } as const;
        }
      }
    });

  }
}

function getShorthands(ctx: Context<typeof enforceShorthandClasses>, dissectedClasses: DissectedClasses) {

  const possibleShorthandClassesGroups: [longhands: DissectedClass[], shorthands: string[]][][] = [];

  for(const shorthandGroup of shorthands){

    const sortedShorthandGroup = shorthandGroup.sort((a, b) => b[0].length - a[0].length);

    const possibleShorthandClasses: [longhands: DissectedClass[], shorthands: string[]][] = [];

    shorthandLoop: for(const [patterns, substitutes] of sortedShorthandGroup){

      const groupedByVariants = Object.values(dissectedClasses).reduce<Record<string, DissectedClass[]>>((acc, dissectedClass) => {
        const variants = dissectedClass.variants?.join(dissectedClass.separator) ?? "";

        acc[variants] ??= [];
        acc[variants].push(dissectedClass);

        return acc;
      }, {});

      for(const variantGroup in groupedByVariants){

        const longhands: DissectedClass[] = [];
        const groups: string[] = [];

        for(const pattern of patterns){
          classNameLoop: for(const dissectedClass of groupedByVariants[variantGroup]){
            const match = dissectedClass.base.match(pattern);

            if(!match){
              continue classNameLoop;
            }

            for(let m = 0; m < match.length; m++){
              if(groups[m] === undefined){
                groups[m] = match[m];
                continue;
              }

              if(m === 0){
                continue;
              }

              if(groups[m] !== match[m]){
                continue shorthandLoop;
              }
            }

            longhands.push(dissectedClass);
          }
        }

        const isImportantAtEnd = longhands.some(longhand => longhand.important[1]);
        const isImportantAtStart = !isImportantAtEnd && longhands.some(longhand => longhand.important[0]);

        const negative = longhands.some(longhand => longhand.negative);

        const prefix = longhands[0]?.prefix ?? "";
        const variants = longhands[0]?.variants;
        const separator = longhands[0]?.separator ?? ":";

        if(
          longhands.length !== patterns.length ||
          longhands.some(longhand => (longhand?.important[0] || longhand?.important[1]) !== (isImportantAtStart || isImportantAtEnd)) ||
          longhands.some(longhand => longhand?.negative !== negative) ||
          longhands.some(longhand => longhand?.variants?.join(separator) !== variants?.join(separator))
        ){
          continue;
        }

        if(longhands.length === patterns.length){
          possibleShorthandClasses.push([longhands, substitutes.map(substitute => buildClass(ctx, {
            base: replacePlaceholders(substitute, groups),
            important: [isImportantAtStart, isImportantAtEnd],
            negative,
            prefix,
            separator,
            variants
          }))]);
        }
      }
    }

    if(possibleShorthandClasses.length > 0){
      possibleShorthandClassesGroups.push(possibleShorthandClasses.sort((a, b) => b[0].length - a[0].length));
    }

  }

  return possibleShorthandClassesGroups;
}
