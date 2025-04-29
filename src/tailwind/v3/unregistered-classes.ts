import rules from "tailwindcss3/lib/lib/generateRules.js";

import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type {
  ConfigWarning,
  GetUnregisteredClassesRequest,
  GetUnregisteredClassesResponse
} from "../api/interface.js";


export async function getUnregisteredClasses({ classes, configPath, cwd }: GetUnregisteredClassesRequest): Promise<GetUnregisteredClassesResponse> {
  const warnings: ConfigWarning[] = [];

  const config = findTailwindConfig(cwd, configPath);

  if(!config){
    warnings.push({
      option: "entryPoint",
      title: `No tailwind css config found at \`${configPath}\``
    });
  }

  const context = createTailwindContextFromConfigFile(config?.path, config?.invalidate);

  const invalidClasses = classes
    .filter(className => {
      return rules.generateRules([className], context).length === 0;
    });

  return [invalidClasses, warnings];
}

interface Variant {
  hasDash: boolean;
  isArbitrary: boolean;
  name: string;
  selectors: unknown;
  values: string[];
}
