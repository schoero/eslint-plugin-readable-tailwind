import { findDefaultConfig, findTailwindConfig } from "./config.js";
import { createTailwindContextFromEntryPoint } from "./context.js";

import type { ConfigWarning, GetClassOrderRequest, GetClassOrderResponse } from "../api/interface.js";


export async function getClassOrder({ classes, configPath, cwd }: GetClassOrderRequest): Promise<GetClassOrderResponse> {
  const warnings: ConfigWarning[] = [];

  const config = findTailwindConfig(cwd, configPath);
  const defaultConfig = findDefaultConfig(cwd);

  if(!config){
    warnings.push({
      option: "entryPoint",
      title: configPath
        ? `No tailwind css config found at \`${configPath}\``
        : "No tailwind css entry point configured"
    });
  }

  const path = config?.path ?? defaultConfig.path;
  const invalidate = config?.invalidate ?? defaultConfig.invalidate;

  if(!path){
    throw new Error("Could not find a valid Tailwind CSS configuration");
  }

  const context = await createTailwindContextFromEntryPoint(path, invalidate);
  return [context.getClassOrder(classes), warnings];
}
