import { findFileRecursive } from "../utils/config.js";
import { createTailwindContextFromConfigFile } from "./config.js";

import type { GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const potentialPaths = [
    ...configPath ? [configPath] : [],
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
    "tailwind.config.ts"
  ];

  const foundPath = findFileRecursive(cwd, potentialPaths);
  const context = createTailwindContextFromConfigFile(foundPath);
  return context.getClassOrder(classes);
}
