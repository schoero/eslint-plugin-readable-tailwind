import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type { ConfigWarning, GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const warnings: ConfigWarning[] = [];

  const config = findTailwindConfig(cwd, configPath);

  if(!config){
    warnings.push({
      option: "entryPoint",
      title: `No tailwind css config found at \`${configPath}\``
    });
  }

  const context = await createTailwindContextFromConfigFile(config);

  return [context.getClassOrder(classes), warnings];
}
