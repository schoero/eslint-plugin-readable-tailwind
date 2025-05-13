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

  const conflicts: ConflictingClasses = {};

  const classRules = classes.reduce<Record<string, RuleContext>>((classRules, className) => ({
    ...classRules,
    [className]: context.parseCandidate(className).reduce((classRules, candidate) => {
      const [rule] = context.compileAstNodes(candidate);
      return {
        ...classRules,
        ...getRuleContext(rule?.node?.nodes)
      };
    }, {})
  }), {});

  for(const className in classRules){
    otherClassLoop: for(const otherClassName in classRules){
      if(className === otherClassName){
        continue otherClassLoop;
      }

      const classRule = classRules[className];
      const otherClassRule = classRules[otherClassName];

      const paths = Object.keys(classRule);
      const otherPaths = Object.keys(otherClassRule);

      if(paths.length !== otherPaths.length){
        continue otherClassLoop;
      }

      const potentialConflicts: ConflictingClasses = {};

      for(const path of paths){
        for(const otherPath of otherPaths){
          if(path !== otherPath){
            continue otherClassLoop;
          }

          if(classRule[path].length !== otherClassRule[otherPath].length){
            continue otherClassLoop;
          }

          for(const classRuleProperty of classRule[path]){
            for(const otherClassRuleProperty of otherClassRule[otherPath]){
              if(
                classRuleProperty.cssPropertyName !== otherClassRuleProperty.cssPropertyName ||
                classRuleProperty.important !== otherClassRuleProperty.important
              ){
                continue otherClassLoop;
              }

              potentialConflicts[className] ??= [];
              potentialConflicts[className].push({
                ...classRuleProperty,
                tailwindClassName: otherClassName
              });
            }
          }
        }
      }

      conflicts[className] ??= [];
      conflicts[className].push(...potentialConflicts[className]);

    }
  }

  return [conflicts, warnings];
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


interface Property {
  cssPropertyName: string;
  important: boolean;
  cssPropertyValue?: string;
}

interface RuleContext {
  [hierarchy: string]: Property[];
}

function getRuleContext(nodes: AstNode[]): RuleContext {
  const context: RuleContext = {};

  if(!nodes){
    return context;
  }

  const checkNested = (nodes: AstNode[], context: RuleContext, path: string = "") => {
    for(const node of nodes.filter(node => !!node)){
      if(node.kind === "declaration"){
        context[path] ??= [];

        if(node.value === undefined){
          continue;
        }

        context[path].push({
          cssPropertyName: node.property,
          cssPropertyValue: node.value,
          important: node.important
        });
        continue;
      }

      if(node.kind === "rule"){
        return void checkNested(node.nodes, context, path + node.selector);
      }

      if(node.kind === "at-rule"){
        return void checkNested(node.nodes, context, path + node.name + node.params);
      }
    }
  };

  checkNested(nodes, context);

  return context;
}
