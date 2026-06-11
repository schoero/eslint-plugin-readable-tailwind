import {
  ES_CONTAINER_TYPES_TO_REPLACE_QUOTES,
  getESMatcherFunctions,
  getLiteralsByESLiteralNode,
  hasESNodeParentExtension,
  isESStringLike
} from "better-tailwindcss:parsers/es.js";
import { getLiteralNodesByMatchers } from "better-tailwindcss:utils/matchers.js";
import {
  addAttribute,
  deduplicateLiterals,
  getContent,
  getIndentation,
  getQuotes,
  getWhitespace,
  matchesName
} from "better-tailwindcss:utils/utils.js";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode, Node as ESNode } from "estree";
import type { Rule as PostCSSRule } from "postcss";
import type { Node as PostCSSSelectorNode } from "postcss-selector-parser";
import type { parseForESLint } from "svelte-eslint-parser";
import type {
  SvelteAttachTag,
  SvelteAttribute,
  SvelteDirective,
  SvelteGenericsDirective,
  SvelteLiteral,
  SvelteMustacheTagText,
  SvelteName,
  SvelteShorthandAttribute,
  SvelteSpecialDirective,
  SvelteSpreadAttribute,
  SvelteStartTag,
  SvelteStyleDirective
} from "svelte-eslint-parser/lib/ast/index.js";

import type {
  BracesMeta,
  Literal,
  LiteralValueQuotes,
  MultilineMeta,
  StringLiteral
} from "better-tailwindcss:types/ast.js";
import type { AttributeSelector, MatcherFunctions, SelectorMatcher } from "better-tailwindcss:types/rule.js";


type SvelteParserServices = ReturnType<typeof parseForESLint>["services"];
type ParserServices = Rule.RuleContext["sourceCode"]["parserServices"];

export const SVELTE_CONTAINER_TYPES_TO_REPLACE_QUOTES = [
  ...ES_CONTAINER_TYPES_TO_REPLACE_QUOTES,
  "SvelteMustacheTag"
];

export const SVELTE_CONTAINER_TYPES_TO_INSERT_BRACES: string[] = [
];

const SVELTE_STYLE_CLASS_CACHE = new WeakMap<object, Set<string>>();

export type GetSvelteStyleClasses = () => Set<string>;

export let getSvelteStyleClasses: GetSvelteStyleClasses = () => { throw new Error("getSvelteStyleClasses() called before being initialized"); };

export function createGetSvelteStyleClasses(parserServices: ParserServices): GetSvelteStyleClasses {
  getSvelteStyleClasses = () => collectSvelteStyleClasses(parserServices);

  return getSvelteStyleClasses;
}


export function getAttributesBySvelteTag(ctx: Rule.RuleContext, node: SvelteStartTag): SvelteAttribute[] {
  return node.attributes.reduce<SvelteAttribute[]>((acc, attribute) => {
    if(isSvelteAttribute(attribute)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}

export function getDirectivesBySvelteTag(ctx: Rule.RuleContext, node: SvelteStartTag): SvelteDirective[] {
  return node.attributes.reduce<SvelteDirective[]>((acc, attribute) => {
    if(isSvelteDirective(attribute)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}

function collectSvelteStyleClasses(parserServices: ParserServices): Set<string> {
  if(!isSvelteParserServices(parserServices)){
    return new Set();
  }

  const cachedClassNames = SVELTE_STYLE_CLASS_CACHE.get(parserServices);

  if(cachedClassNames){
    return cachedClassNames;
  }

  const styleContext = parserServices.getStyleContext();

  if(styleContext.status !== "success"){
    const result = new Set<string>();

    SVELTE_STYLE_CLASS_CACHE.set(parserServices, result);

    return result;
  }

  const classNames = new Set<string>();

  styleContext.sourceAst.walkRules((rule: PostCSSRule) => {
    try {
      const selectorAst = parserServices.getStyleSelectorAST(rule);

      selectorAst.walk((selectorNode: PostCSSSelectorNode) => {
        if(selectorNode.type === "class"){
          classNames.add(selectorNode.value);
        }
      });
    } catch {}
  });

  SVELTE_STYLE_CLASS_CACHE.set(parserServices, classNames);

  return classNames;
}

export function getLiteralsBySvelteAttribute(ctx: Rule.RuleContext, attribute: SvelteAttribute, selectors: AttributeSelector[]): Literal[] {

  // skip shorthand attributes #42
  if(!Array.isArray(attribute.value)){
    return [];
  }

  const name = attribute.key.name;

  const literals = selectors.reduce<Literal[]>((literals, selector) => {

    for(const value of attribute.value){
      if(!matchesName(selector.name.toLowerCase(), name.toLowerCase())){ continue; }

      if(!selector.match){
        literals.push(...getLiteralsBySvelteLiteralNode(ctx, value));
        continue;
      }

      literals.push(...getLiteralsBySvelteMatchers(ctx, value, selector.match));
    }

    return literals;
  }, []);

  return literals
    .filter(deduplicateLiterals)
    .map(addAttribute(name));

}

export function getLiteralsBySvelteDirective(ctx: Rule.RuleContext, directive: SvelteDirective, selectors: AttributeSelector[]): Literal[] {

  if(directive.kind !== "Class"){
    return [];
  }

  const name = `class:${directive.key.name.name}`;

  const literals = selectors.reduce<Literal[]>((literals, selector) => {

    if(!matchesName(selector.name.toLowerCase(), name.toLowerCase())){ return literals; }

    if(!selector.match){
      return literals;
    }

    literals.push(...getLiteralsBySvelteMatchers(ctx, directive.key.name, selector.match));

    return literals;
  }, []);

  return literals
    .filter(deduplicateLiterals)
    .map(addAttribute(name));

}

function getLiteralsBySvelteMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: SelectorMatcher[]): Literal[] {
  const matcherFunctions = getSvelteMatcherFunctions(matchers);

  const literalNodes = getLiteralNodesByMatchers<ESBaseNode>(ctx, node, matcherFunctions);
  const literals = literalNodes.flatMap(literalNode => getLiteralsBySvelteLiteralNode(ctx, literalNode));

  return literals.filter(deduplicateLiterals);
}

function getLiteralsBySvelteLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {

  if(isSvelteStringLiteral(node)){
    const stringLiteral = getStringLiteralBySvelteStringLiteral(ctx, node);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isSvelteName(node)){
    const stringLiteral = getStringLiteralBySvelteName(ctx, node);

    if(stringLiteral){
      return [stringLiteral];
    }
  }

  if(isSvelteMustacheTag(node)){
    return getLiteralsBySvelteLiteralNode(ctx, node.expression);
  }

  if(isESStringLike(node)){
    return getLiteralsBySvelteESLiteralNode(ctx, node);
  }

  return [];

}

function getLiteralsBySvelteESLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {
  const literals = getLiteralsByESLiteralNode(ctx, node);

  return literals.map(literal => {
    if(!hasESNodeParentExtension(node)){ return literal; }

    const multilineQuotes = getMultilineQuotes(node);

    return {
      ...literal,
      ...multilineQuotes
    };
  });
}

function getStringLiteralBySvelteName(ctx: Rule.RuleContext, node: SvelteName): StringLiteral {

  const raw = node.name;

  const braces = getBracesByString(ctx, raw);
  const isInterpolated = getIsInterpolated(ctx, raw);
  const quotes = getQuotes(raw);
  const content = getContent(raw, quotes, braces);
  const whitespaces = getWhitespace(content);
  const line = ctx.sourceCode.lines[isInterpolated ? node.parent.loc.start.line - 1 : node.loc.start.line - 1];
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    ...multilineQuotes,
    content,
    indentation,
    isInterpolated,
    loc: node.loc,
    range: node.range, // include quotes in range
    raw,
    supportsMultiline: false,
    type: "StringLiteral"
  };

}

function getStringLiteralBySvelteStringLiteral(ctx: Rule.RuleContext, node: SvelteLiteral): StringLiteral | undefined {

  const raw = ctx.sourceCode.getText(node as unknown as ESNode, 1, 1);

  const braces = getBracesByString(ctx, raw);
  const isInterpolated = getIsInterpolated(ctx, raw);
  const quotes = getQuotes(raw);
  const content = getContent(raw, quotes, braces);
  const whitespaces = getWhitespace(content);
  const line = ctx.sourceCode.lines[isInterpolated ? node.parent.loc.start.line - 1 : node.loc.start.line - 1];
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    ...multilineQuotes,
    content,
    indentation,
    isInterpolated,
    loc: node.loc,
    range: [node.range[0] - 1, node.range[1] + 1], // include quotes in range
    raw,
    supportsMultiline: true,
    type: "StringLiteral"
  };

}

function getBracesByString(ctx: Rule.RuleContext, raw: string): BracesMeta {
  const closingBraces = raw.trim().startsWith("}") ? "}" : undefined;
  const openingTemplateBraces = raw.trim().endsWith("${") ? "${" : undefined;
  const openingBrace = raw.trim().endsWith("{") ? "{" : undefined;
  const openingBraces = openingTemplateBraces ?? openingBrace;

  return {
    closingBraces,
    openingBraces
  };
}

function getIsInterpolated(ctx: Rule.RuleContext, raw: string): boolean {
  const braces = getBracesByString(ctx, raw);
  return !!braces.closingBraces || !!braces.openingBraces;
}

function getMultilineQuotes(node: ESBaseNode & Rule.NodeParentExtension | SvelteLiteral | SvelteName): MultilineMeta {
  const surroundingBraces = SVELTE_CONTAINER_TYPES_TO_INSERT_BRACES.includes(node.parent.type);
  const multilineQuotes: LiteralValueQuotes[] = SVELTE_CONTAINER_TYPES_TO_REPLACE_QUOTES.includes(node.parent.type)
    ? ["'", "\"", "`"]
    : [];

  return {
    multilineQuotes,
    surroundingBraces
  };
}

function isSvelteAttribute(node:
  | SvelteAttachTag
  | SvelteAttribute
  | SvelteDirective
  | SvelteGenericsDirective
  | SvelteShorthandAttribute
  | SvelteSpecialDirective
  | SvelteSpreadAttribute
  | SvelteStyleDirective): node is SvelteAttribute {
  return node.type === "SvelteAttribute";
}

function isSvelteDirective(node: ESBaseNode): node is SvelteDirective {
  return node.type === "SvelteDirective";
}

function isSvelteStringLiteral(node: ESBaseNode): node is SvelteLiteral {
  return node.type === "SvelteLiteral";
}

function isSvelteName(node: ESBaseNode): node is SvelteName {
  return node.type === "SvelteName";
}

function isSvelteMustacheTag(node: ESBaseNode): node is SvelteMustacheTagText {
  return node.type === "SvelteMustacheTag" &&
    "kind" in node && node.kind === "text";
}

function isSvelteParserServices(parserServices: ParserServices): parserServices is SvelteParserServices {
  return typeof parserServices?.getStyleContext === "function";
}

function getSvelteMatcherFunctions(matchers: SelectorMatcher[]): MatcherFunctions {
  return getESMatcherFunctions(matchers, {
    isStringLikeNode(node) {
      return isSvelteName(node) || isSvelteStringLiteral(node);
    }
  });
}
