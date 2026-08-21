import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { createGetVariantOrder, getVariantOrder } from "better-tailwindcss:tailwindcss/variant-order.js";
import { buildClass } from "better-tailwindcss:utils/class.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { VARIANT_ORDER_FLAGS } from "better-tailwindcss:utils/order.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { splitClasses } from "better-tailwindcss:utils/utils.js";


export const enforceConsistentVariantOrder = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce a consistent variant order for Tailwind classes.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-variant-order.md",
  name: "enforce-consistent-variant-order",
  recommended: false,

  messages: {
    order: "Incorrect variant order. '{{ className }}' should be '{{ fix }}'."
  },

  initialize: ctx => {
    createGetDissectedClasses(ctx);
    createGetVariantOrder(ctx);
  },

  lintLiterals: (ctx, literals) => {
    if(ctx.version.major <= 3){
      return;
    }

    const asyncCtx = async(ctx);

    for(const literal of literals){
      const classes = splitClasses(literal.content);
      const { dissectedClasses, warnings: dissectedWarnings } = getDissectedClasses(asyncCtx, classes);
      const { variantOrder, warnings } = getVariantOrder(asyncCtx, classes);
      const allWarnings = [...dissectedWarnings, ...warnings];

      lintClasses(ctx, literal, className => {
        const dissectedClass = dissectedClasses[className];

        if(!dissectedClass?.variants || dissectedClass.variants.length <= 1){
          return;
        }

        if(dissectedClass.variants.some(variant => variantOrder[variant] === undefined)){
          return;
        }

        const sortedVariants = dissectedClass.variants.toSorted((variantA, variantB) => {
          return compareVariantOrder(
            variantOrder[variantA],
            variantOrder[variantB]
          );
        });

        if(dissectedClass.variants.every((value, index) => value === sortedVariants[index])){
          return false;
        }

        const fix = buildClass(ctx, {
          ...dissectedClass,
          variants: sortedVariants
        });

        return {
          data: {
            className,
            fix
          },
          fix,
          id: "order",
          warnings: allWarnings
        } as const;
      });
    }
  }
});

function compareVariantOrder(orderA: number | undefined, orderB: number | undefined): number {
  if(
    orderA === orderB ||
    orderA === undefined ||
    orderB === undefined ||
    orderA < VARIANT_ORDER_FLAGS.GLOBAL &&
    orderB < VARIANT_ORDER_FLAGS.GLOBAL
  ){
    return 0;
  }

  if(orderB > orderA){
    return +1;
  }

  return -1;
}
