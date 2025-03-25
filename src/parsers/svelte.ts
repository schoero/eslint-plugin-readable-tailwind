import {
  getESObjectPath,
  getLiteralsByESLiteralNode,
  hasESNodeParentExtension,
  isESNode,
  isESObjectKey,
  isESStringLike,
  isInsideObjectValue
} from "readable-tailwind:parsers:es.js";
import { MatcherType } from "readable-tailwind:types:rule.js";
import {
  getLiteralNodesByMatchers,
  isAttributesMatchers,
  isAttributesName,
  isAttributesRegex,
  isInsideConditionalExpressionTest,
  isInsideLogicalExpressionLeft,
  matchesPathPattern
} from "readable-tailwind:utils:matchers.js";
import { getLiteralsByESNodeAndRegex } from "readable-tailwind:utils:regex.js";
import {
  deduplicateLiterals,
  getIndentation,
  getQuotes,
  getWhitespace,
  matchesName
} from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { BaseNode as ESBaseNode, Node as ESNode } from "estree";
import type {
  SvelteAttribute,
  SvelteDirective,
  SvelteGenericsDirective,
  SvelteLiteral,
  SvelteMustacheTagText,
  SvelteShorthandAttribute,
  SvelteSpecialDirective,
  SvelteSpreadAttribute,
  SvelteStartTag,
  SvelteStyleDirective
} from "svelte-eslint-parser/lib/ast/index.js";

import type { Literal, LiteralValueQuotes, MultilineMeta, Node, StringLiteral } from "readable-tailwind:types:ast.js";
import type { Attributes, Matcher, MatcherFunctions } from "readable-tailwind:types:rule.js";


export function getAttributesBySvelteTag(ctx: Rule.RuleContext, node: SvelteStartTag): SvelteAttribute[] {
  return node.attributes.reduce<SvelteAttribute[]>((acc, attribute) => {
    if(isSvelteAttribute(attribute)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}

export function getLiteralsBySvelteAttribute(ctx: Rule.RuleContext, attribute: SvelteAttribute, attributes: Attributes): Literal[] {

  // skip shorthand attributes #42
  if(!Array.isArray(attribute.value)){
    return [];
  }

  const [value] = attribute.value;

  if(!value){ // empty attribute
    return [];
  }

  const literals = attributes.reduce<Literal[]>((literals, attributes) => {
    if(isAttributesName(attributes)){
      if(!matchesName(attributes.toLowerCase(), attribute.key.name.toLowerCase())){ return literals; }
      literals.push(...getLiteralsBySvelteLiteralNode(ctx, value));
    } else if(isAttributesRegex(attributes)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, attributes));
    } else if(isAttributesMatchers(attributes)){
      if(!matchesName(attributes[0].toLowerCase(), attribute.key.name.toLowerCase())){ return literals; }
      literals.push(...getLiteralsBySvelteMatchers(ctx, value, attributes[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

function getLiteralsBySvelteMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: Matcher[]): Literal[] {
  const matcherFunctions = getSvelteMatcherFunctions(matchers);
  const literalNodes = getLiteralNodesByMatchers(ctx, node, matcherFunctions);
  const literals = literalNodes.flatMap(literalNode => getLiteralsBySvelteLiteralNode(ctx, literalNode));
  return deduplicateLiterals(literals);
}

function getLiteralsBySvelteLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {

  if(isSvelteStringLiteral(node)){
    const stringLiteral = getStringLiteralBySvelteStringLiteral(ctx, node);

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
    const { multilineQuotes, surroundingBraces } = getMultilineQuotes(node);

    if(multilineQuotes && multilineQuotes.length > 0){
      literal.multilineQuotes = multilineQuotes;
      literal.surroundingBraces = surroundingBraces;
    }

    return literal;
  });
}

function getStringLiteralBySvelteStringLiteral(ctx: Rule.RuleContext, node: SvelteLiteral): StringLiteral | undefined {

  const content = node.value;
  const raw = ctx.sourceCode.getText(node as unknown as ESNode, 1, 1);
  const line = ctx.sourceCode.lines[node.loc.start.line - 1];

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const indentation = getIndentation(line);
  const multilineQuotes = getMultilineQuotes(node);

  return {
    ...whitespaces,
    ...quotes,
    ...multilineQuotes,
    content,
    indentation,
    loc: node.loc,
    node: node as unknown as Node,
    parent: node.parent as unknown as Node,
    range: [node.range[0] - 1, node.range[1] + 1], // include quotes in range
    raw,
    supportsMultiline: true,
    type: "StringLiteral"
  };

}

function getMultilineQuotes(node: (ESBaseNode) | SvelteLiteral): MultilineMeta {
  const containerTypesToReplaceQuotes = [
    "SvelteMustacheTag"
  ];

  const surroundingBraces = false;
  const multiline: LiteralValueQuotes[] = "parent" in node && containerTypesToReplaceQuotes.includes(node.parent.type)
    ? ["'", "\"", "`"]
    : [];

  return {
    multilineQuotes: multiline,
    surroundingBraces
  };
}

function isSvelteAttribute(attribute:
  | SvelteAttribute
  | SvelteDirective
  | SvelteGenericsDirective
  | SvelteShorthandAttribute
  | SvelteSpecialDirective
  | SvelteSpreadAttribute
  | SvelteStyleDirective): attribute is SvelteAttribute {
  return "key" in attribute && "name" in attribute.key && typeof attribute.key.name === "string";
}

function isSvelteStringLiteral(node: ESBaseNode): node is SvelteLiteral {
  return node.type === "SvelteLiteral";
}

function isSvelteMustacheTag(node: ESBaseNode): node is SvelteMustacheTagText {
  return node.type === "SvelteMustacheTag" &&
    "kind" in node && node.kind === "text";
}

function getSvelteMatcherFunctions(matchers: Matcher[]): MatcherFunctions<ESBaseNode> {
  return matchers.reduce<MatcherFunctions<ESBaseNode>>((matcherFunctions, matcher) => {
    switch (matcher.match){
      case MatcherType.String: {
        matcherFunctions.push((node): node is ESBaseNode => {

          if(!isESNode(node)){ return false; }

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }
          if(!hasESNodeParentExtension(node)){ return false; }

          return (
            !isESObjectKey(node) &&
            !isInsideObjectValue(node) &&
            (isESStringLike(node) || isSvelteStringLiteral(node))
          );
        });
        break;
      }
      case MatcherType.ObjectKey: {
        matcherFunctions.push((node): node is ESBaseNode => {

          if(!isESNode(node)){ return false; }

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }

          if(!hasESNodeParentExtension(node)){ return false; }
          if(!isESObjectKey(node)){ return false; }

          const path = getESObjectPath(node);

          return path && matcher.pathPattern ? matchesPathPattern(path, matcher.pathPattern) : true;
        });
        break;
      }
      case MatcherType.ObjectValue: {
        matcherFunctions.push((node): node is ESBaseNode => {

          if(!isESNode(node)){ return false; }

          if(isInsideConditionalExpressionTest(node)){ return false; }
          if(isInsideLogicalExpressionLeft(node)){ return false; }
          if(!hasESNodeParentExtension(node)){ return false; }
          if(isESObjectKey(node)){ return false; }

          const path = getESObjectPath(node);
          const matchesPattern = path !== undefined &&
            matcher.pathPattern
            ? matchesPathPattern(path, matcher.pathPattern)
            : true;
          return isInsideObjectValue(node) && isESStringLike(node) && matchesPattern;
        });
        break;
      }
    }
    return matcherFunctions;
  }, []);
}
