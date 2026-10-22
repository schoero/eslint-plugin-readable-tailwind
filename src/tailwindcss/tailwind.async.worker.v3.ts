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
  getCanonicalClasses: async (_ctx, classes, _options) => {
    return classes.reduce<CanonicalClasses>((acc, className) => {
      acc[className] = {
        input: [className],
        output: className
      };
      return acc;
    }, {});
  },
  getClassOrder: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getClassOrder(tailwindContext, classes);
  },
  getConflictingClasses: async (_ctx, _classes) => {
    return {} satisfies ConflictingClasses;
  },
  getCustomComponentClasses: async ctx => {
    return getCustomComponentClasses(ctx);
  },
  getDissectedClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getDissectedClasses(ctx, tailwindContext, classes);
  },
  getPrefix: async ctx => {
    const tailwindContext = await createTailwindContext(ctx);
    const prefix = getPrefix(tailwindContext);
    const suffix = getSuffix(tailwindContext);

    return { prefix, suffix };
  },
  getUnknownClasses: async (ctx, classes) => {
    const tailwindContext = await createTailwindContext(ctx);
    return getUnknownClasses(ctx, tailwindContext, classes);
  },
  getVariantOrder: async () => {
    return getVariantOrder();
  }
};

runAsWorker(async <Operation extends keyof Operations>(operation: Operation, cache: CachedStoreState, ...args: Parameters<Operations[Operation]>) => {
  CachedStore.attachSharedState(cache);
  return handlers[operation](...args);
});
