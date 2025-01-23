import { findFileRecursive } from "../utils/config.js";
import { cssResolver } from "../utils/resolvers.js";
import { createTailwindContextFromEntryPoint } from "./config.js";

import type { GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const potentialStylesheetPaths = [
    ...configPath ? [configPath] : []
  ];
  const potentialConfigPaths = [
    ...configPath ? [configPath] : [],
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
    "tailwind.config.ts"
  ];

  const foundStylesheetPath = findFileRecursive(cwd, potentialStylesheetPaths);
  const foundConfigPath = findFileRecursive(cwd, potentialConfigPaths);
  const defaultStyleSheetPath = cssResolver.resolveSync({}, cwd, "tailwindcss/theme.css");

  const path = foundStylesheetPath ?? foundConfigPath ?? defaultStyleSheetPath;

  if(!path){
    throw new Error("Could not find a valid Tailwind CSS configuration");
  }

  const context = await createTailwindContextFromEntryPoint(path);
  return context.getClassOrder(classes);
}
