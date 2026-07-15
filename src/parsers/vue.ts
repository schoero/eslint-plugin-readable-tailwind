import {
  ES_CONTAINER_TYPES_TO_INSERT_BRACES,
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
import type { AST } from "vue-eslint-parser";

import type {
  BindingMeta,
  Literal,
  LiteralValueQuotes,
  MultilineMeta,
  QuoteMeta,
  StringLiteral
} from "better-tailwindcss:types/ast.js";
import type { AttributeSelector, MatcherFunctions, SelectorMatcher } from "better-tailwindcss:types/rule.js";


export const VUE_CONTAINER_TYPES_TO_REPLACE_QUOTES = [
  ...ES_CONTAINER_TYPES_TO_REPLACE_QUOTES
];

export const VUE_CONTAINER_TYPES_TO_INSERT_BRACES = [
  ...ES_CONTAINER_TYPES_TO_INSERT_BRACES
];


export function getAttributesByVueStartTag(ctx: Rule.RuleContext, node: AST.VStartTag): (AST.VAttribute | AST.VDirective)[] {
  return node.attributes;
}

export function getLiteralsByVueAttribute(ctx: Rule.RuleContext, attribute: AST.VAttribute | AST.VDirective, selectors: AttributeSelector[]): Literal[] {

  if(attribute.value === null){
    return [];
  }

  const name = getVueAttributeName(attribute);
  const value = attribute.value;

  const literals = selectors.reduce<Literal[]>((literals, selector) => {
    if(!matchesName(getVueBoundName(selector.name).toLowerCase(), name?.toLowerCase())){ return literals; }

    if(!selector.match){
      literals.push(...getLiteralsByVueLiteralNode(ctx, value));
      return literals;
    }

    literals.push(...getLiteralsByVueMatchers(ctx, value, selector.match));

    return literals;
  }, []);

  return literals
    .filter(deduplicateLiterals)
    .map(addAttribute(name));

}

function getLiteralsByVueLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {

  if(!hasESNodeParentExtension(node)){ return []; }

  if(isVueLiteralNode(node)){
    const literal = getStringLiteralByVueStringLiteral(ctx, node);
    return [literal];
  }

  if(isESStringLike(node)){
    return getLiteralsByVueESLiteralNode(ctx, node);
  }

  return [];
}


function getLiteralsByVueMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: SelectorMatcher[]): Literal[] {
  const matcherFunctions = getVueMatcherFunctions(matchers);

  const literalNodes = getLiteralNodesByMatchers<ESBaseNode>(ctx, node, matcherFunctions);
  const literals = literalNodes.flatMap(literalNode => getLiteralsByVueLiteralNode(ctx, literalNode));

  return literals.filter(deduplicateLiterals);
}

function getLiteralsByVueESLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode & Rule.NodeParentExtension): Literal[] {
  const literals = getLiteralsByESLiteralNode(ctx, node);

  return literals.map(literal => {
    const multilineQuotes = getMultilineQuotes(node);

    return {
      ...literal,
      ...multilineQuotes
    };
  });
}

function getStringLiteralByVueStringLiteral(ctx: Rule.RuleContext, node: AST.VLiteral): StringLiteral {

  const raw = ctx.sourceCode.getText(node as unknown as ESNode);
  const line = ctx.sourceCode.lines[node.loc.start.line - 1];

  const quotes = getQuotes(raw);
  const content = getContent(raw, quotes);
  const whitespaces = getWhitespace(content);
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);
  const binding = getBinding(node, quotes, content);

  return {
    ...whitespaces,
    ...quotes,
    ...multilineQuotes,
    ...binding && { binding },
    content,
    indentation,
    loc: node.loc,
    priorLiterals: [],
    range: [node.range[0], node.range[1]],
    raw,
    supportsMultiline: true,
    type: "StringLiteral"
  };

}

function getBinding(node: AST.VLiteral, quotes: QuoteMeta, content: string): BindingMeta["binding"] {
  const attribute = node.parent;

  // nothing to convert for empty or whitespace-only attributes
  if(content.trim() === ""){
    return undefined;
  }

  // only static attributes (`class="…"`) can be converted to a binding
  if(attribute.type !== "VAttribute" || attribute.directive || attribute.key.type !== "VIdentifier"){
    return undefined;
  }

  // skip if the element already has a binding with the same name (`:class` or `v-bind:class`) to not create a duplicate attribute
  const hasExistingBinding = attribute.parent.attributes.some(sibling => {
    return sibling.directive &&
      sibling.key.name.name === "bind" &&
      sibling.key.argument?.type === "VIdentifier" &&
      sibling.key.argument.name.toLowerCase() === attribute.key.name.toLowerCase();
  });

  if(hasExistingBinding){
    return undefined;
  }

  // use the raw name to preserve the original casing (the parsed key name is lowercased)
  const name = attribute.key.rawName;
  const openingQuote = quotes.openingQuote ?? "\"";
  const closingQuote = quotes.closingQuote ?? "\"";

  return {
    closing: closingQuote,
    multilineQuotes: ["`"] as LiteralValueQuotes[],
    opening: `:${name}=${openingQuote}`,
    range: [attribute.range[0], attribute.range[1]]
  };
}

function getMultilineQuotes(node: ESBaseNode & Rule.NodeParentExtension | AST.VLiteral): MultilineMeta {
  const surroundingBraces = VUE_CONTAINER_TYPES_TO_INSERT_BRACES.includes(node.parent.type);
  const multilineQuotes: LiteralValueQuotes[] = VUE_CONTAINER_TYPES_TO_REPLACE_QUOTES.includes(node.parent.type)
    ? ["`"]
    : [];

  return {
    multilineQuotes,
    surroundingBraces
  };
}

function getVueBoundName(name: string): string {
  return name.startsWith(":") ? `v-bind:${name.slice(1)}` : name;
}

function getVueAttributeName(attribute: AST.VAttribute | AST.VDirective): string | undefined {
  if(isVueAttribute(attribute)){
    return attribute.key.name;
  }

  if(isVueDirective(attribute)){
    if(attribute.key.argument?.type === "VIdentifier"){
      return `v-${attribute.key.name.name}:${attribute.key.argument.name}`;
    }
  }
}

function isVueAttribute(attribute: AST.VAttribute | AST.VDirective): attribute is AST.VAttribute {
  return attribute.key.type === "VIdentifier";
}

function isVueDirective(attribute: AST.VAttribute | AST.VDirective): attribute is AST.VDirective {
  return attribute.key.type === "VDirectiveKey";
}

function isVueLiteralNode(node: ESBaseNode): node is AST.VLiteral {
  return node.type === "VLiteral";
}

function getVueMatcherFunctions(matchers: SelectorMatcher[]): MatcherFunctions {
  return getESMatcherFunctions(matchers, {
    isStringLikeNode: isVueLiteralNode
  });
}
