import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type { GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const config = findTailwindConfig(cwd, configPath);
  const context = createTailwindContextFromConfigFile(config?.path, config?.invalidate);
  return context.getClassOrder(classes);
}
