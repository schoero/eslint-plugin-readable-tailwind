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
  const allClasses: string[] = context.getClassList();
  const variants: Variant[] = context.getVariants();

  const allVariants = variants.flatMap(variant => {
    if(variant.values.length){
      return variant.values.map(value => value === "DEFAULT" ? variant.name : `${variant.name}${variant.hasDash ? "-" : ""}${value}`);
    }
    return [variant.name];
  });

  const invalidClasses = classes
    .filter(className => !allClasses.includes(className))
    .filter(invalidClass => {
      const potentialVariants = allVariants.filter(variant => invalidClass.startsWith(variant));
      return allClasses.some(className => potentialVariants.some(variant => {
        return `${variant}:${className}` === invalidClass;
      })) !== true;
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
