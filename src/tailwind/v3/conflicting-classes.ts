import { } from "postcss/lib/expandApplyAtRules";
import { isClean } from "postcss/lib/symbols";
import * as generator from "tailwindcss3/lib/lib/generateRules.js";

import { findTailwindConfig } from "./config.js";
import { createTailwindContextFromConfigFile } from "./context.js";

import type { ConfigWarning, GetConflictingClassesRequest, GetConflictingClassesResponse } from "../api/interface.js";


export type ConflictingClasses = { [hierarchy: string]: { cssPropertyName: string; tailwindClassName: string; cssPropertyValue?: string; }[]; };

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

  const potentialConflicts: ConflictingClasses = {};

  for(const className of classes){
    const rules = generator.generateRules?.([className], context) ?? generator.default?.generateRules?.([className], context);

    for(const [_, rule] of rules){
      const isRoot = rule[isClean];
      extractCssProperty(className, isRoot ? rule.nodes : [rule], potentialConflicts, "");
    }
  }

  const conflictingClasses = Object.fromEntries(Object.entries(potentialConflicts).filter(([_, value]) => value.length > 1));

  return [conflictingClasses, warnings];
}


function extractCssProperty(className: string, nodes: any[], conflicts: ConflictingClasses, path: string): ConflictingClasses {
  for(const node of nodes){
    if(node.type === "decl"){
      conflicts[`${path}${node.prop}`] ??= [];
      conflicts[`${path}${node.prop}`].push({
        cssPropertyName: node.prop,
        cssPropertyValue: node.value,
        tailwindClassName: className
      });
      continue;
    }

    if(node.type === "rule"){
      return extractCssProperty(className, node.nodes, conflicts, path + node.selector);
    }

    if(node.type === "at-rule"){
      return extractCssProperty(className, node.nodes, conflicts, path + node.name + node.params);
    }
  }

  return conflicts;
}
