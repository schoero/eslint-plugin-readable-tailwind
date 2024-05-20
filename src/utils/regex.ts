import {
  findParentESTemplateLiteralByESTemplateElement,
  getLiteralNodesByRegex,
  getLiteralsByESTemplateLiteral,
  getStringLiteralByESStringLiteral,
  hasESNodeParentExtension,
  isESSimpleStringLiteral,
  isESTemplateElement
} from "readable-tailwind:parsers:es";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode } from "estree";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { RegexConfig } from "readable-tailwind:types:rule.js";


export function getLiteralsByESNodeAndRegex(ctx: Rule.RuleContext, node: ESBaseNode, regexCallee: RegexConfig): Literal[] {

  if(!hasESNodeParentExtension(node)){ return []; }

  const [containerRegexString, stringLiteralRegexString] = regexCallee;

  const sourceCode = ctx.sourceCode.getText(node);

  const containerRegex = new RegExp(containerRegexString, "gdm");
  const stringLiteralRegex = new RegExp(stringLiteralRegexString, "gdm");
  const containers = sourceCode.matchAll(containerRegex);

  const matchedLiterals: Literal[] = [];

  for(const container of containers){
    if(!container.indices || container.indices.length < 2){ continue; }

    for(const [containerStartIndex] of container.indices.slice(1)){

      const containerNode = ctx.sourceCode.getNodeByRangeIndex((node.range?.[0] ?? 0) + containerStartIndex);

      if(!containerNode){ continue; }
      const literalNodes = getLiteralNodesByRegex(ctx, containerNode, stringLiteralRegex);

      for(const literalNode of literalNodes){
        if(isESSimpleStringLiteral(literalNode)){
          const literal = getStringLiteralByESStringLiteral(ctx, literalNode);
          literal && matchedLiterals.push(literal);
        }
        if(isESTemplateElement(literalNode) && hasESNodeParentExtension(literalNode)){
          const templateLiteralNode = findParentESTemplateLiteralByESTemplateElement(literalNode);
          const literals = templateLiteralNode && getLiteralsByESTemplateLiteral(ctx, templateLiteralNode);
          literals && matchedLiterals.push(...literals);
        }
      }
    }

  }

  return matchedLiterals;

}
