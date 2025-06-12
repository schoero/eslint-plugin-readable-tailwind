import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type { ConfigWarning, GetPrefixRequest, GetPrefixResponse } from "../api/interface.js";


export async function getPrefix({ configPath, cwd }: GetPrefixRequest): Promise<GetPrefixResponse> {
  const warnings: ConfigWarning[] = [];

  const config = findTailwindConfig(cwd, configPath);

  if(!config){
    warnings.push({
      option: "entryPoint",
      title: `No tailwind css config found at \`${configPath}\``
    });
  }

  const context = await createTailwindContextFromConfigFile(config);

  const prefix = context.tailwindConfig.prefix ?? "";

  return [prefix, warnings];
}
