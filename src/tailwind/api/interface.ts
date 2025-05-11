import type { Warning } from "better-tailwindcss:utils:utils.js";


export interface GetClassOrderRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}

export interface GetUnregisteredClassesRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}

export interface GetConflictingClassesRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}

export type ConfigWarning = Omit<Warning, "url"> & Partial<Pick<Warning, "url">>;

export type GetClassOrderResponse = [classOrder: [className: string, order: bigint | null][], warnings: ConfigWarning[]];
export type GetUnregisteredClassesResponse = [unregisteredClasses: string[], warnings: ConfigWarning[]];
export type GetConflictingClassesResponse = [conflictingClasses: ConflictingClasses, warnings: ConfigWarning[]];
