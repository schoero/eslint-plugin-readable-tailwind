import type { TailwindcssVersion } from "src/tailwind/utils/version.js";

import type { Warning } from "better-tailwindcss:utils/utils.js";


export type ConfigWarning = Omit<Warning, "url"> & Partial<Pick<Warning, "url">>;


export interface GetClassOrderRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}
export type GetClassOrderResponse = [classOrder: [className: string, order: bigint | null][], warnings: ConfigWarning[]];


export interface GetUnregisteredClassesRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}
export type GetUnregisteredClassesResponse = [unregisteredClasses: string[], warnings: ConfigWarning[]];


export interface GetVersionRequest {
  cwd: string;
  configPath?: string;
}
export type GetVersionResponse = [version: TailwindcssVersion];


export interface GetPrefixRequest {
  cwd: string;
  configPath?: string;
}
export type GetPrefixResponse = [prefix: string, warnings: ConfigWarning[]];


export interface GetConflictingClassesRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}

export type ConflictingClasses = {
  [className: string]: {
    cssPropertyName: string;
    important: boolean;
    tailwindClassName: string;
    cssPropertyValue?: string;
  }[];
};

export type GetConflictingClassesResponse = [conflictingClasses: ConflictingClasses, warnings: ConfigWarning[]];
