import type { ClassProperties } from "./class-properties.js";
import type { AstNode } from "./conflicting-classes.async.v4.js";


export function getClassProperties(tailwindContext: any, classes: string[]): ClassProperties {
  const classProperties: ClassProperties = Object.create(null);

  for(const className of classes){
    const properties = new Set<string>();

    for(const candidate of tailwindContext.parseCandidate(className)){
      // compile without variants, because some variants add declarations, like `content` for `before:`
      for(const { node } of tailwindContext.compileAstNodes({ ...candidate, variants: [] })){
        collectProperties([node], properties);
      }
    }

    classProperties[className] = properties.size > 0
      ? [...properties].sort()
      : undefined;
  }

  return classProperties;
}

function collectProperties(nodes: (AstNode | undefined)[], properties: Set<string>) {
  for(const node of nodes){
    if(!node || node.kind === "comment"){
      continue;
    }

    if(node.kind === "declaration"){
      if(node.value !== undefined){
        properties.add(node.property);
      }
      continue;
    }

    // skip the `@property` registrations of internal custom properties
    if(node.kind === "at-rule" && node.name === "@property"){
      continue;
    }

    collectProperties(node.nodes, properties);
  }
}
