import { findDefaultConfig, findTailwindConfigPath } from "./config.js";
import { createTailwindContextFromEntryPoint } from "./context.js";

import type {
  ConfigWarning,
  GetUnregisteredClassesRequest,
  GetUnregisteredClassesResponse
} from "../api/interface.js";


export async function getUnregisteredClasses({ classes, configPath, cwd }: GetUnregisteredClassesRequest): Promise<GetUnregisteredClassesResponse> {
  const warnings: ConfigWarning[] = [];

  const config = findTailwindConfigPath(cwd, configPath);
  const defaultConfig = findDefaultConfig(cwd);

  if(!config){
    warnings.push({
      option: "entryPoint",
      title: configPath
        ? `No tailwind css config found at \`${configPath}\``
        : "No tailwind css entry point configured"
    });
  }

  const path = config ?? defaultConfig;

  if(!path){
    throw new Error("Could not find a valid Tailwind CSS configuration");
  }

  const context = await createTailwindContextFromEntryPoint(path);

  const css = context.candidatesToCss(classes);
  const invalidClasses = classes.filter((_, index) => css.at(index) === null);

  return [invalidClasses, warnings];
}
