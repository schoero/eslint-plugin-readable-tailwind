import type { CanonicalClasses, CanonicalClassOptions } from "../tailwindcss/canonical-classes.js";
import type { ClassOrder } from "../tailwindcss/class-order.js";
import type { ConflictingClasses } from "../tailwindcss/conflicting-classes.js";
import type { CustomComponentClasses } from "../tailwindcss/custom-component-classes.js";
import type { DissectedClasses } from "../tailwindcss/dissect-classes.js";
import type { Prefix, Suffix } from "../tailwindcss/prefix.js";
import type { UnknownClass } from "../tailwindcss/unknown-classes.js";
import type { VariantOrder } from "../tailwindcss/variant-order.js";
import type { Async } from "../types/async.js";
import type { AsyncContext } from "../utils/context.js";


export interface Operations {
  getCanonicalClasses: Async<(ctx: AsyncContext, classes: string[], options: CanonicalClassOptions) => CanonicalClasses>;
  getClassOrder: Async<(ctx: AsyncContext, classes: string[]) => ClassOrder>;
  getConflictingClasses: Async<(ctx: AsyncContext, classes: string[]) => ConflictingClasses>;
  getCustomComponentClasses: Async<(ctx: AsyncContext) => CustomComponentClasses>;
  getDissectedClasses: Async<(ctx: AsyncContext, classes: string[]) => DissectedClasses>;
  getPrefix: Async<(ctx: AsyncContext) => { prefix: Prefix; suffix: Suffix; }>;
  getUnknownClasses: Async<(ctx: AsyncContext, classes: string[]) => UnknownClass[]>;
  getVariantOrder: Async<(ctx: AsyncContext, classes: string[]) => VariantOrder>;
}

// mapped type variant that enables correlated generic dispatch https://github.com/microsoft/TypeScript/issues/30581
export type OperationHandlers = {
  [Operation in keyof Operations]: (...args: Parameters<Operations[Operation]>) => ReturnType<Operations[Operation]>;
};
