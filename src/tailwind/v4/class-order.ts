import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromEntryPoint } from "./context.js";

import type { GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const path = findTailwindConfig(cwd, configPath);
  const context = await createTailwindContextFromEntryPoint(path);
  return context.getClassOrder(classes);
}
