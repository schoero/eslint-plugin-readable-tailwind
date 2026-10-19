import { runAsWorker } from "synckit";

import { CachedStore } from "../async-utils/cached-store.js";
import { getCanonicalClasses } from "./canonical-classes.async.v4.js";
import { getClassOrder } from "./class-order.async.v4.js";
import { getConflictingClasses } from "./conflicting-classes.async.v4.js";
import { createTailwindContext } from "./context.async.v4.js";
import { getCustomComponentClasses } from "./custom-component-classes.async.v4.js";
import { getDissectedClasses } from "./dissect-classes.async.v4.js";
import { getPrefix, getSuffix } from "./prefix.async.v4.js";
import { getUnknownClasses } from "./unknown-classes.async.v4.js";
import { getVariantOrder } from "./variant-order.async.v4.js";

import type { CachedStoreState } from "../async-utils/cached-store.js";
import type { OperationHandlers, Operations } from "../async-utils/operations.js";


const handlers: OperationHandlers = {
  getCanonicalClasses: async (ctx, classes, options) => {
    const tailwindContext = await createTailwindContext(ctx);
    const canonicalClasses = getCanonicalClasses(tailwindContext, classes, options);

    return { canonicalClasses, warnings: ctx.warnings };
  },
  getClassOrder: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const classOrder = getClassOrder(tailwindContext, classes);

    return { classOrder, warnings: ctx.warnings };
  },
  getConflictingClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const conflictingClasses = await getConflictingClasses(tailwindContext, classes);

    return { conflictingClasses, warnings: ctx.warnings };
  },
  getCustomComponentClasses: async ctx => {
    const customComponentClasses = getCustomComponentClasses(ctx);

    return { customComponentClasses, warnings: ctx.warnings };
  },
  getDissectedClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const dissectedClasses = getDissectedClasses(tailwindContext, classes);

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
    const unknownClasses = getUnknownClasses(tailwindContext, classes);

    return { unknownClasses, warnings: ctx.warnings };
  },
  getVariantOrder: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    const variantOrder = getVariantOrder(tailwindContext, classes);

    return { variantOrder, warnings: ctx.warnings };
  }
};

runAsWorker(async <Operation extends keyof Operations>(operation: Operation, cache: CachedStoreState, ...args: Parameters<Operations[Operation]>) => {
  CachedStore.attachShared(cache);
  return handlers[operation](...args);
});
