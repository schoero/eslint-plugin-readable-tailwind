import * as rules from "tailwindcss3/lib/lib/generateRules.js";

import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type { ConfigWarning, GetConflictingClassesRequest, GetConflictingClassesResponse } from "../api/interface.js";


export async function getConflictingClasses({ classes, configPath, cwd }: GetConflictingClassesRequest): Promise<GetConflictingClassesResponse> {
  const warnings: ConfigWarning[] = [];

  const config = findTailwindConfig(cwd, configPath);

  if(!config){
    warnings.push({
      option: "entryPoint",
      title: `No tailwind css config found at \`${configPath}\``
    });
  }

  const context = createTailwindContextFromConfigFile(config?.path, config?.invalidate);

  const conflictingClasses = classes
    .filter(className => {
      return (rules.generateRules?.([className], context) ?? rules.default?.generateRules?.([className], context)).length === 0;
    });

  // @ts-expect-error - sdf
  return [conflictingClasses, warnings];
}
