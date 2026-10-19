import { runAsWorker } from "synckit";

import { CachedStore } from "../async-utils/cached-store.js";
import { getClassOrder } from "./class-order.async.v3.js";
import { createTailwindContext } from "./context.async.v3.js";
import { getCustomComponentClasses } from "./custom-component-classes.async.v3.js";
import { getDissectedClasses } from "./dissect-classes.async.v3.js";
import { getPrefix, getSuffix } from "./prefix.async.v3.js";
import { getUnknownClasses } from "./unknown-classes.async.v3.js";
import { getVariantOrder } from "./variant-order.async.v3.js";

import type { CachedStoreState } from "../async-utils/cached-store.js";
import type { OperationHandlers, Operations } from "../async-utils/operations.js";
import type { CanonicalClasses } from "./canonical-classes.js";
import type { ConflictingClasses } from "./conflicting-classes.js";


const handlers: OperationHandlers = {
  getCanonicalClasses: async (ctx, classes, _options) => {
    const canonicalClasses = classes.reduce<CanonicalClasses>((acc, className) => {
      acc[className] = {
        input: [className],
        output: className
      };
      return acc;
    }, {});

    return { canonicalClasses, warnings: ctx.warnings };
  },
  getClassOrder: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const classOrder = getClassOrder(tailwindContext, classes);

    return { classOrder, warnings: ctx.warnings };
  },
  getConflictingClasses: async (ctx, _classes) => {
    const conflictingClasses: ConflictingClasses = {};

    return { conflictingClasses, warnings: ctx.warnings };
  },
  getCustomComponentClasses: async ctx => {
    const customComponentClasses = await getCustomComponentClasses(ctx);

    return { customComponentClasses, warnings: ctx.warnings };
  },
  getDissectedClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const dissectedClasses = await getDissectedClasses(ctx, tailwindContext, classes);

    return { dissectedClasses, warnings: ctx.warnings };
  },
  getPrefix: async ctx => {
    const tailwindContext = await createTailwindContext(ctx);
    const prefix = getPrefix(tailwindContext);
    const suffix = getSuffix(tailwindContext);

    return { prefix, suffix, warnings: ctx.warnings };
  },
  getUnknownClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const unknownClasses = await getUnknownClasses(ctx, tailwindContext, classes);

    return { unknownClasses, warnings: ctx.warnings };
  },
  getVariantOrder: async ctx => {
    const variantOrder = getVariantOrder();

    return { variantOrder, warnings: ctx.warnings };
  }
};

runAsWorker(async <Operation extends keyof Operations>(operation: Operation, cache: CachedStoreState, ...args: Parameters<Operations[Operation]>) => {
  CachedStore.attachShared(cache);
  return handlers[operation](...args);
});
