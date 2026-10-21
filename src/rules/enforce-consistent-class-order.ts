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

import type { DissectedClass, DissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import type { Warning } from "better-tailwindcss:types/async.js";
import type { Context } from "better-tailwindcss:types/rule.js";
import type { AsyncContext } from "better-tailwindcss:utils/context.js";


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
    groupBy: optional(
      pipe(
        union([
          literal("none"),
          literal("variant")
        ]),
        description("Defines how classes should be grouped. Classes within a group are sorted according to the `order` option.")
      ),
      "none"
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

    const asyncCtx = async(ctx);

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

      const [sortedClassChunks, warnings] = sortClassNames(ctx, asyncCtx, classChunks);

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


function sortClassNames(ctx: Context<typeof enforceConsistentClassOrder>, asyncCtx: AsyncContext, classes: string[]): [classes: string[], warnings?: (Warning | undefined)[]] {

  const { componentClassOrder, componentClassPosition, detectComponentClasses, unknownClassOrder, unknownClassPosition } = ctx.options;

  // `strict` is a shorthand for `{ order: "official", groupBy: "variant" }`
  const order = ctx.options.order === "strict" ? "official" : ctx.options.order;
  const groupBy = ctx.options.order === "strict" && ctx.options.groupBy === "none" ? "variant" : ctx.options.groupBy;

  // ungrouped alphabetical sorting compares the raw class names and ignores component and unknown classes
  if(groupBy === "none" && order === "asc"){
    return [classes.toSorted((a, b) => compareClasses(a, b))];
  }

  if(groupBy === "none" && order === "desc"){
    return [classes.toSorted((a, b) => compareClasses(b, a))];
  }

  if(classes.length <= 1){
    return [classes];
  }

  const { classOrder, warnings } = getClassOrder(asyncCtx, classes);

  const { dissectedClasses } = order !== "official" || groupBy !== "none"
    ? getDissectedClasses(asyncCtx, classes)
    : { dissectedClasses: {} };

  const customComponentClasses = detectComponentClasses
    ? getCustomComponentClasses(asyncCtx).customComponentClasses
    : [];

  const sortedClasses = classOrder
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

      if(order === "asc"){
        return compareBaseClasses(dissectedClasses, classA, classB);
      }

      if(order === "desc"){
        return compareBaseClasses(dissectedClasses, classB, classA);
      }

      if(aIndex === bIndex){ return 0; }
      if(aIndex === null){ return -1; }
      if(bIndex === null){ return +1; }
      return +(aIndex - bIndex > 0n) - +(aIndex - bIndex < 0n);
    })
    .map(([className]) => className);

  if(groupBy === "variant"){
    return [groupByVariant(order, sortedClasses, dissectedClasses), warnings];
  }

  return [sortedClasses, warnings];

}

function groupByVariant(order: "asc" | "desc" | "official", sortedClasses: string[], dissectedClasses: DissectedClasses): string[] {

  const variantMap: VariantMap = {};

  for(const originalClass of sortedClasses){
    const dissectedClass = dissectedClasses[originalClass];

    // parse variants manually for custom component classes
    const variants = ["", ...dissectedClass.variants ?? originalClass.match(/^(.*):/)?.[1]?.split(":") ?? []];

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

  return getVariantGroupOrder(order, variantMap);

}


type VariantMap = {
  [variant: string]: {
    dissectedClasses: DissectedClass[];
    nested: VariantMap;
  };
};

function getVariantGroupOrder(order: "asc" | "desc" | "official", variantMap: VariantMap): string[] {
  const orderedClasses: string[] = [];

  const orderedVariants = Object.keys(variantMap).sort((a, b) => {
    const aIsArbitrary = isArbitrary(a);
    const bIsArbitrary = isArbitrary(b);

    // sort arbitrary variants last
    if(aIsArbitrary && !bIsArbitrary){ return +1; }
    if(!aIsArbitrary && bIsArbitrary){ return -1; }

    if(order === "asc"){
      return compareClasses(a, b);
    }

    if(order === "desc"){
      return compareClasses(b, a);
    }

    // keep the official variant order
    return 0;
  });

  for(let v = 0; v < orderedVariants.length; v++){
    const variant = orderedVariants[v];

    const { dissectedClasses, nested } = variantMap[variant];

    orderedClasses.push(...dissectedClasses.map(dissectedClass => dissectedClass.className));

    if(Object.keys(nested).length > 0){
      orderedClasses.push(...getVariantGroupOrder(order, nested));
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

// compare by the base class to ignore variants, prefix, negative and important modifiers
function compareBaseClasses(dissectedClasses: DissectedClasses, classA: string, classB: string): number {
  const baseA = dissectedClasses[classA]?.base ?? classA;
  const baseB = dissectedClasses[classB]?.base ?? classB;

  return compareClasses(baseA, baseB) || compareClasses(classA, classB);
}

function isArbitrary(variant?: string): boolean {
  if(!variant){
    return false;
  }

  return variant.includes("[") && variant.includes("]");
}
