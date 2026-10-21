import { readFileSync } from "node:fs";
import { dirname } from "node:path";

import { fork } from "@eslint/css-tree";
import { tailwind4 } from "tailwind-csstree";

import { resolveCss } from "../async-utils/resolvers.js";

import type { CssNode } from "@eslint/css-tree";

import type { AsyncContext } from "../utils/context.js";
import type { CustomComponentClasses } from "./custom-component-classes.js";


interface ImportInfo {
  path: string;
  layer?: string | undefined;
}

interface CssFile {
  ast: CssNode;
  imports: ImportInfo[];
}

interface CssFiles {
  [resolvedPath: string]: CssFile;
}

const { findAll, generate, parse, walk } = fork(tailwind4);

export function getCustomComponentClasses(ctx: AsyncContext): CustomComponentClasses {
  const resolvedPath = resolveCss(ctx, ctx.tailwindConfigPath);

  if(!resolvedPath){
    return [];
  }

  // the host caches the result, the tailwind context tracks the same files
  const files = parseCssFilesDeep(ctx, resolvedPath);

  return getCustomComponentUtilities(files, resolvedPath);
}

function parseCssFilesDeep(ctx: AsyncContext, resolvedPath: string, cssFiles: CssFiles = {}): CssFiles {
  if(resolvedPath in cssFiles){
    return cssFiles;
  }

  const cssFile = parseCssFile(ctx, resolvedPath);

  if(!cssFile){
    return cssFiles;
  }

  cssFiles[resolvedPath] = cssFile;

  for(const { path } of cssFile.imports){
    parseCssFilesDeep(ctx, path, cssFiles);
  }

  return cssFiles;
}

const parseCssFile = (ctx: AsyncContext, resolvedPath: string): CssFile | undefined => {
  try {
    const content = readFileSync(resolvedPath, "utf-8");
    const ast = parse(content);

    const importNodes = findAll(ast, node => node.type === "Atrule" &&
      node.name === "import" &&
      node.prelude?.type === "AtrulePrelude");

    const imports = importNodes.reduce<ImportInfo[]>((imports, importNode) => {
      if(importNode.type !== "Atrule" || !importNode.prelude){
        return imports;
      }

      const prelude = generate(importNode.prelude);
      const importStatement = prelude.match(/["'](?<importPath>[^"']+)["'](?<rest>.*)/);

      if(!importStatement){
        return imports;
      }

      const { importPath, rest } = importStatement.groups || {};

      const layerMatch = rest?.match(/layer(?:\((?<layerName>[^)]+)\))?/);
      const layer = layerMatch ? layerMatch.groups?.layerName || "anonymous" : undefined;

      const cwd = dirname(resolvedPath);
      const resolvedImportPath = resolveCss(ctx, importPath, cwd);

      if(resolvedImportPath){
        imports.push({ layer, path: resolvedImportPath });
      }

      return imports;
    }, []);

    return {
      ast,
      imports
    } satisfies CssFile;

  } catch {}
};

function getCustomComponentUtilities(files: CssFiles, filePath: string, currentLayer: string[] = []): string[] {
  const classes = new Set<string>();
  const file = files[filePath];

  if(!file){
    return [];
  }

  for(const { layer, path } of file.imports){
    const nextLayer = [...currentLayer];

    if(layer){
      nextLayer.push(layer);
    }

    const importedClasses = getCustomComponentUtilities(files, path, nextLayer);

    for(const importedClass of importedClasses){
      classes.add(importedClass);
    }
  }

  const localLayers: string[] = [];

  walk(file.ast, {
    enter: (node: CssNode) => {
      if(node.type === "Atrule" && node.name === "layer" && node.prelude?.type === "AtrulePrelude" && node.block){
        const layerName = generate(node.prelude).trim();
        localLayers.push(layerName);
      }

      if(node.type === "ClassSelector"){
        if([...currentLayer, ...localLayers][0] === "components"){
          classes.add(node.name);
        }
      }
    },
    leave: (node: CssNode) => {
      if(node.type === "Atrule" && node.name === "layer" && node.block){
        localLayers.pop();
      }
    }
  });

  return Array.from(classes);
}
