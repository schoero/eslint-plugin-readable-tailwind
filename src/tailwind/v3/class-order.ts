import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type { GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const path = findTailwindConfig(cwd, configPath);
  const context = createTailwindContextFromConfigFile(path);
  return context.getClassOrder(classes);
}
