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
    return getCanonicalClasses(tailwindContext, classes, options);
  },
  getClassOrder: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getClassOrder(tailwindContext, classes);
  },
  getConflictingClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getConflictingClasses(tailwindContext, classes);
  },
  getCustomComponentClasses: async ctx => {
    return getCustomComponentClasses(ctx);
  },
  getDissectedClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getDissectedClasses(tailwindContext, classes);
  },
  getPrefix: async ctx => {
    const tailwindContext = await createTailwindContext(ctx);
    const prefix = getPrefix(tailwindContext);
    const suffix = getSuffix(tailwindContext);

    return { prefix, suffix };
  },
  getUnknownClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getUnknownClasses(tailwindContext, classes);
  },
  getVariantOrder: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getVariantOrder(tailwindContext, classes);
  }
};

runAsWorker(async <Operation extends keyof Operations>(operation: Operation, cache: CachedStoreState, ...args: Parameters<Operations[Operation]>) => {
  CachedStore.attachSharedState(cache);
  return handlers[operation](...args);
});
