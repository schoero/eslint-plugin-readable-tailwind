import { description, literal, optional, pipe, strictObject, union } from "valibot";

import { createGetClassOrder, getClassOrder } from "better-tailwindcss:tailwindcss/class-order.js";
import {
  createGetCustomComponentClasses,
  getCustomComponentClasses
} from "better-tailwindcss:tailwindcss/custom-component-classes.js";
import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { async } from "better-tailwindcss:utils/context.js";
import { escapeNestedQuotes } from "better-tailwindcss:utils/quotes.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { display, splitClasses, splitWhitespaces } from "better-tailwindcss:utils/utils.js";

import type { DissectedClass } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const enforceConsistentClassOrder = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce a consistent order for tailwind classes.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-class-order.md",
  name: "enforce-consistent-class-order",
  recommended: true,

  messages: {
    order: "Incorrect class order. Expected\n\n{{ notSorted }}\n\nto be\n\n{{ sorted }}"
  },

  schema: strictObject({
    componentClassOrder: optional(
      pipe(
        union([
          literal("asc"),
          literal("desc"),
          literal("preserve")
        ]),
        description("Defines how component classes should be ordered among themselves.")
      ),
      "preserve"
    ),
    componentClassPosition: optional(
      pipe(
        union([
          literal("start"),
          literal("end")
        ]),
        description("Defines where component classes should be placed in relation to the whole string literal.")
      ),
      "start"
    ),
    order: optional(
      pipe(
        union([
          literal("asc"),
          literal("desc"),
          literal("official"),
          literal("strict")
        ]),
        description("The algorithm to use when sorting classes.")
      ),
      "official"
    ),
    unknownClassOrder: optional(
      pipe(
        union([
          literal("asc"),
          literal("desc"),
          literal("preserve")
        ]),
        description("Defines how component classes should be ordered among themselves.")
      ),
      "preserve"
    ),
    unknownClassPosition: optional(
      pipe(
        union([
          literal("start"),
          literal("end")
        ]),
        description("Defines where component classes should be placed in relation to the whole string literal.")
      ),
      "start"
    )
  }),

  initialize: ctx => {
    const { detectComponentClasses } = ctx.options;

    createGetClassOrder(ctx);
    createGetDissectedClasses(ctx);

    if(detectComponentClasses){
      createGetCustomComponentClasses(ctx);
    }
  },

  lintLiterals: (ctx, literals) => {

    const { messageStyle } = ctx.options;

    for(const literal of literals){

      const classChunks = splitClasses(literal.content);

      if(classChunks.length <= 1){
        continue;
      }

      const whitespaceChunks = splitWhitespaces(literal.content);

      const unsortableClasses: [string, string] = ["", ""];

      // remove sticky classes
      if(literal.closingBraces && whitespaceChunks[0] === ""){
        whitespaceChunks.shift();
        unsortableClasses[0] = classChunks.shift() ?? "";
      }
      if(literal.openingBraces && whitespaceChunks[whitespaceChunks.length - 1] === ""){
        whitespaceChunks.pop();
        unsortableClasses[1] = classChunks.pop() ?? "";
      }

      const [sortedClassChunks, warnings] = sortClassNames(ctx, classChunks);

      const classes: string[] = [];

      for(let i = 0; i < Math.max(sortedClassChunks.length, whitespaceChunks.length); i++){
        whitespaceChunks[i] && classes.push(whitespaceChunks[i]);
        sortedClassChunks[i] && classes.push(sortedClassChunks[i]);
      }

      const escapedClasses = escapeNestedQuotes(
        [
          unsortableClasses[0],
          ...classes,
          unsortableClasses[1]
        ].join(""),
        literal.openingQuote ?? literal.closingQuote ?? "`"
      );

      const fixedClasses = [
        literal.openingQuote ?? "",
        literal.isInterpolated && literal.closingBraces ? literal.closingBraces : "",
        escapedClasses,
        literal.isInterpolated && literal.openingBraces ? literal.openingBraces : "",
        literal.closingQuote ?? ""
      ].join("");

      if(literal.raw === fixedClasses){
        continue;
      }

      ctx.report({
        data: {
          notSorted: display(messageStyle, literal.raw),
          sorted: display(messageStyle, fixedClasses)
        },
        fix: fixedClasses,
        id: "order",
        range: literal.range,
        warnings
      });
    }
  }
});


function sortClassNames(ctx: Context<typeof enforceConsistentClassOrder>, classes: string[]): [classes: string[], warnings?: (Warning | undefined)[]] {

  const { componentClassOrder, componentClassPosition, order, unknownClassOrder, unknownClassPosition } = ctx.options;

  if(order === "asc"){
    return [classes.toSorted((a, b) => compareClasses(a, b))];
  }

  if(order === "desc"){
    return [classes.toSorted((a, b) => compareClasses(b, a))];
  }

  if(classes.length <= 1){
    return [classes];
  }

  const { classOrder, warnings } = getClassOrder(async(ctx), classes);
  const { detectComponentClasses } = ctx.options;
  const customComponentClasses = detectComponentClasses
    ? getCustomComponentClasses(async(ctx)).customComponentClasses
    : [];

  const officiallySortedClasses = classOrder
    .toSorted((a, b) => {
      const [classA, aIndex] = a;
      const [classB, bIndex] = b;

      const componentClassSorting = getCustomOrder(
        componentClassPosition,
        componentClassOrder,
        classA,
        classB,
        className => customComponentClasses.includes(className)
      );

      if(componentClassSorting !== undefined){
        return componentClassSorting;
      }

      const unknownClassSorting = getCustomOrder(
        unknownClassPosition,
        unknownClassOrder,
        classA,
        classB,
        className => {
          return (
            (classA === className && aIndex === null || classB === className && bIndex === null) &&
            !customComponentClasses.includes(className)
          );
        }
      );

      if(unknownClassSorting !== undefined){
        return unknownClassSorting;
      }

      if(aIndex === bIndex){ return 0; }
      if(aIndex === null){ return -1; }
      if(bIndex === null){ return +1; }
      return +(aIndex - bIndex > 0n) - +(aIndex - bIndex < 0n);
    })
    .map(([className]) => className);

  if(order === "official"){
    return [officiallySortedClasses, warnings];
  }

  const { dissectedClasses } = getDissectedClasses(async(ctx), classes);

  const variantMap: VariantMap = {};

  for(const originalClass in dissectedClasses){
    const dissectedClass = dissectedClasses[originalClass];

    // parse variants manually for custom component classes
    const variants = dissectedClass.variants ?? originalClass.match(/^(.*):/)?.[1]?.split(":") ?? [];

    variants.unshift("");

    for(let v = 0, variantMapLevel = variantMap; v < variants.length; v++){
      const isLastVariant = v === variants.length - 1;

      variantMapLevel[variants[v]] ??= {
        dissectedClasses: [],
        nested: {}
      };

      if(isLastVariant){
        variantMapLevel[variants[v]].dissectedClasses.push(dissectedClass);
        continue;
      }

      variantMapLevel = variantMapLevel[variants[v]].nested;

    }
  }

  const strictOrder = getStrictOrder(variantMap);

  return [strictOrder, warnings];

}


type VariantMap = {
  [variant: string]: {
    dissectedClasses: DissectedClass[];
    nested: VariantMap;
  };
};

function getStrictOrder(variantMap: VariantMap): string[] {
  const orderedClasses: string[] = [];

  const orderedVariants = Object.keys(variantMap).sort((a, b) => {
    const aIsArbitrary = isArbitrary(a);
    const bIsArbitrary = isArbitrary(b);

    // sort arbitrary variants last
    if(aIsArbitrary && !bIsArbitrary){ return +1; }
    if(!aIsArbitrary && bIsArbitrary){ return -1; }

    return 0;
  });

  for(let v = 0; v < orderedVariants.length; v++){
    const variant = orderedVariants[v];

    const { dissectedClasses, nested } = variantMap[variant];

    orderedClasses.push(...dissectedClasses.map(dissectedClass => dissectedClass.className));

    if(Object.keys(nested).length > 0){
      orderedClasses.push(...getStrictOrder(nested));
    }
  }

  return orderedClasses;

}

function getCustomOrder(position: "end" | "start", order: "asc" | "desc" | "preserve", classA: string, classB: string, isCustomClass: (className: string) => boolean): number | undefined {
  const aIsCustomClass = isCustomClass(classA);
  const bIsCustomClass = isCustomClass(classB);

  if(position === "start"){
    if(aIsCustomClass && !bIsCustomClass){ return -1; }
    if(!aIsCustomClass && bIsCustomClass){ return +1; }

    if(aIsCustomClass && bIsCustomClass){
      if(order === "asc"){
        return compareClasses(classA, classB);
      }
      if(order === "desc"){
        return compareClasses(classB, classA);
      }
      return 0;
    }
  }
  if(position === "end"){
    if(aIsCustomClass && !bIsCustomClass){ return +1; }
    if(!aIsCustomClass && bIsCustomClass){ return -1; }

    if(aIsCustomClass && bIsCustomClass){
      if(order === "asc"){
        return compareClasses(classA, classB);
      }
      if(order === "desc"){
        return compareClasses(classB, classA);
      }
      return 0;
    }
  }

}

function compareClasses(classA: string, classB: string): number {
  if(classA === classB){ return 0; }
  return classA < classB ? -1 : +1;
}

function isArbitrary(variant?: string): boolean {
  if(!variant){
    return false;
  }

  return variant.includes("[") && variant.includes("]");
}
