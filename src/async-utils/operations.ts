import type { GetCanonicalClasses } from "../tailwindcss/canonical-classes.js";
import type { GetClassOrder } from "../tailwindcss/class-order.js";
import type { GetClassProperties } from "../tailwindcss/class-properties.js";
import type { GetConflictingClasses } from "../tailwindcss/conflicting-classes.js";
import type { GetCustomComponentClasses } from "../tailwindcss/custom-component-classes.js";
import type { GetDissectedClasses } from "../tailwindcss/dissect-classes.js";
import type { GetPrefix } from "../tailwindcss/prefix.js";
import type { GetUnknownClasses } from "../tailwindcss/unknown-classes.js";
import type { GetVariantOrder } from "../tailwindcss/variant-order.js";
import type { Async } from "../types/async.js";


export interface Operations {
  getCanonicalClasses: Async<GetCanonicalClasses>;
  getClassOrder: Async<GetClassOrder>;
  getClassProperties: Async<GetClassProperties>;
  getConflictingClasses: Async<GetConflictingClasses>;
  getCustomComponentClasses: Async<GetCustomComponentClasses>;
  getDissectedClasses: Async<GetDissectedClasses>;
  getPrefix: Async<GetPrefix>;
  getUnknownClasses: Async<GetUnknownClasses>;
  getVariantOrder: Async<GetVariantOrder>;
}

// mapped type variant that enables correlated generic dispatch https://github.com/microsoft/TypeScript/issues/30581
export type OperationHandlers = {
  [Operation in keyof Operations]: (...args: Parameters<Operations[Operation]>) => ReturnType<Operations[Operation]>;
};
