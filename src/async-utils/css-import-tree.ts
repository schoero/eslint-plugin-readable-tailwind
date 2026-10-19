import { readFileSync } from "node:fs";
import { dirname } from "node:path";

import { fork } from "@eslint/css-tree";
import { tailwind4 } from "tailwind-csstree";

import { resolveCss } from "../async-utils/resolvers.js";
import { createVisitedNodes, visitNode } from "../utils/visitedNodes.js";

import type { AsyncContext } from "../utils/context.js";


const { findAll, generate, parse } = fork(tailwind4);


export interface CssImportTree {
  [path: string]: CssImportTree | undefined;
}

export interface CssFileWithImports {
  imports: { path: string; }[];
}

export type ParseCssFile = (ctx: AsyncContext, resolvedPath: string) => CssFileWithImports | undefined;


export function getCssImportTree(
  ctx: AsyncContext,
  entryPath: string,
  parseCssFile: ParseCssFile
): CssImportTree {
  const visited = createVisitedNodes<string>();

  return buildTree(ctx, entryPath, parseCssFile, visited);
}

function buildTree(
  ctx: AsyncContext,
  resolvedPath: string,
  parseCssFile: ParseCssFile,
  visited: ReturnType<typeof createVisitedNodes<string>>
): CssImportTree {
  if(!visitNode(visited, resolvedPath)){
    return {};
  }

  const cssFile = parseCssFile(ctx, resolvedPath);

  if(!cssFile){
    return {};
  }

  const tree: CssImportTree = {};

  for(const { path } of cssFile.imports){
    tree[path] = buildTree(ctx, path, parseCssFile, visited);
  }

  return tree;
}

export function flattenCssImportTree(tree: CssImportTree): string[] {
  const paths = new Set<string>();

  for(const path in tree){
    paths.add(path);

    const subtree = tree[path];
    if(subtree){
      for(const nestedPath of flattenCssImportTree(subtree)){
        paths.add(nestedPath);
      }
    }
  }

  return Array.from(paths);
}

export const parseCssFileWithTree: ParseCssFile = (ctx, resolvedPath) => {
  try {
    const content = readFileSync(resolvedPath, "utf-8");
    const ast = parse(content);

    const importNodes = findAll(ast, node => node.type === "Atrule" &&
      node.name === "import" &&
      node.prelude?.type === "AtrulePrelude");

    const imports = importNodes.reduce<{ path: string; }[]>((imports, importNode) => {
      if(importNode.type !== "Atrule" || !importNode.prelude){
        return imports;
      }

      const prelude = generate(importNode.prelude);
      const importStatement = prelude.match(/["'](?<importPath>[^"']+)["']/);

      if(!importStatement?.groups?.importPath){
        return imports;
      }

      const cwd = dirname(resolvedPath);
      const resolvedImportPath = resolveCss(ctx, importStatement.groups.importPath, cwd);

      if(resolvedImportPath){
        imports.push({ path: resolvedImportPath });
      }

      return imports;
    }, []);

    return { imports };
  } catch {}
};
