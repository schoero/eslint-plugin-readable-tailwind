import { findDefaultConfig, findTailwindConfig } from "./config.js";
import { createTailwindContextFromEntryPoint } from "./context.js";

import type {
  ConfigWarning,
  ConflictingClasses,
  GetConflictingClassesRequest,
  GetConflictingClassesResponse
} from "../api/interface.js";


export async function getConflictingClasses({ classes, configPath, cwd }: GetConflictingClassesRequest): Promise<GetConflictingClassesResponse> {
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

  const potentialConflicts: ConflictingClasses = {};

  for(const className of classes){
    const candidates = context.parseCandidate(className);

    for(const candidate of candidates){
      const rules = context.compileAstNodes(candidate);
      for(const rule of rules){
        extractCssProperty(className, rule.node.nodes, potentialConflicts, "");
      }
    }
  }

  const conflictingClasses = Object.fromEntries(Object.entries(potentialConflicts).filter(([_, value]) => value.length > 1));

  return [conflictingClasses, warnings];
}

export type StyleRule = {
  kind: "rule";
  nodes: AstNode[];
  selector: string;
};

export type AtRule = {
  kind: "at-rule";
  name: string;
  nodes: AstNode[];
  params: string;
};

export type Declaration = {
  important: boolean;
  kind: "declaration";
  property: string;
  value: string | undefined;
};

export type Comment = {
  kind: "comment";
  value: string;
};

export type Context = {
  context: Record<string, boolean | string>;
  kind: "context";
  nodes: AstNode[];
};

export type AtRoot = {
  kind: "at-root";
  nodes: AstNode[];
};

export type Rule = AtRule | StyleRule;
export type AstNode = AtRoot | AtRule | Comment | Context | Declaration | StyleRule;


function extractCssProperty(className: string, nodes: AstNode[], conflicts: ConflictingClasses, path: string): ConflictingClasses {
  for(const node of nodes){
    if(node.kind === "declaration"){
      conflicts[`${path}${node.property}`] ??= [];
      conflicts[`${path}${node.property}`].push({
        cssPropertyName: node.property,
        cssPropertyValue: node.value,
        tailwindClassName: className
      });
      continue;
    }

    if(node.kind === "rule"){
      return extractCssProperty(className, node.nodes, conflicts, path + node.selector);
    }

    if(node.kind === "at-rule"){
      return extractCssProperty(className, node.nodes, conflicts, path + node.name + node.params);
    }
  }

  return conflicts;
}
