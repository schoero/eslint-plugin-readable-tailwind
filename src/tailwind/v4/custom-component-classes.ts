import { readFile } from "node:fs/promises";

import { fork } from "@eslint/css-tree";
import { tailwind4 } from "tailwind-csstree";

import { withCache } from "../utils/cache.js";
import { findTailwindConfigPath } from "./config.js";

import type { CssNode } from "@eslint/css-tree";

import type {
  ConfigWarning,
  GetCustomComponentClassesRequest,
  GetCustomComponentClassesResponse
} from "../api/interface.js";


const { findAll, generate, parse } = fork(tailwind4);

export async function getCustomComponentClasses({ configPath, cwd }: GetCustomComponentClassesRequest): Promise<GetCustomComponentClassesResponse> {
  const warnings: ConfigWarning[] = [];

  const path = findTailwindConfigPath(cwd, configPath);

  if(!path){
    warnings.push({
      option: "entryPoint",
      title: configPath
        ? `No tailwind css config found at \`${configPath}\``
        : "No tailwind css entry point configured"
    });
  }

  if(!path){
    return [[], warnings];
  }

  const ast = await getASTFromEntryPoint(path);
  const customComponentUtilities = getCustomComponentUtilities(ast);

  return [customComponentUtilities, warnings];
}


const getASTFromEntryPoint = async (entryPoint: string) => withCache(entryPoint, async () => {
  const entryFile = await readFile(entryPoint, "utf-8");
  return parse(entryFile);
});

function getCustomComponentUtilities(ast: CssNode) {
  const customComponentUtilities: string[] = [];

  const componentLayers = findAll(ast, node => {
    return node.type === "Atrule" &&
      node.name === "layer" &&
      node.prelude?.type === "AtrulePrelude" &&
      generate(node.prelude).trim() === "components";
  });

  for(const layer of componentLayers){
    const classSelectors = findAll(layer, node => node.type === "ClassSelector");

    for(const classNode of classSelectors){
      if(classNode.type !== "ClassSelector"){
        continue;
      }

      if(customComponentUtilities.includes(classNode.name)){
        continue;
      }

      customComponentUtilities.push(classNode.name);
    }
  }

  return customComponentUtilities;
}
