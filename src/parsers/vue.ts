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
import type { AST } from "vue-eslint-parser";

import type { Literal, LiteralValueQuotes, MultilineMeta, Node, StringLiteral } from "readable-tailwind:types:ast.js";
import type { Attributes, Matcher, MatcherFunctions } from "readable-tailwind:types:rule.js";


export function getAttributesByVueStartTag(ctx: Rule.RuleContext, node: AST.VStartTag): (AST.VAttribute | AST.VDirective)[] {
  return node.attributes;
}


export function getLiteralsByVueAttribute(ctx: Rule.RuleContext, attribute: AST.VAttribute | AST.VDirective, attributes: Attributes): Literal[] {

  if(attribute.value === null){
    return [];
  }

  const value = attribute.value;

  const literals = attributes.reduce<Literal[]>((literals, attributes) => {
    if(isAttributesName(attributes)){
      if(!matchesName(getVueBoundName(attributes).toLowerCase(), getVueAttributeName(attribute)?.toLowerCase())){ return literals; }
      literals.push(...getLiteralsByVueLiteralNode(ctx, value));
    } else if(isAttributesRegex(attributes)){
      literals.push(...getLiteralsByESNodeAndRegex(ctx, attribute, attributes));
    } else if(isAttributesMatchers(attributes)){
      if(!matchesName(getVueBoundName(attributes[0]).toLowerCase(), getVueAttributeName(attribute)?.toLowerCase())){ return literals; }
      literals.push(...getLiteralsByVueMatchers(ctx, value, attributes[1]));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);

}

function getLiteralsByVueLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {

  if(isVueLiteralNode(node)){
    const literal = getStringLiteralByVueStringLiteral(ctx, node);
    return [literal];
  }

  if(isESStringLike(node)){
    return getLiteralsByVueESLiteralNode(ctx, node);
  }

  return [];
}

function getLiteralsByVueMatchers(ctx: Rule.RuleContext, node: ESBaseNode, matchers: Matcher[]): Literal[] {
  const matcherFunctions = getVueMatcherFunctions(matchers);
  const literalNodes = getLiteralNodesByMatchers(ctx, node, matcherFunctions);
  const literals = literalNodes.flatMap(literalNode => getLiteralsByVueLiteralNode(ctx, literalNode));
  return deduplicateLiterals(literals);
}

function getLiteralsByVueESLiteralNode(ctx: Rule.RuleContext, node: ESBaseNode): Literal[] {
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

function getStringLiteralByVueStringLiteral(ctx: Rule.RuleContext, node: AST.VLiteral): StringLiteral {

  const content = node.value;
  const raw = ctx.sourceCode.getText(node as unknown as ESNode);
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
    range: [node.range[0], node.range[1]],
    raw,
    supportsMultiline: true,
    type: "StringLiteral"
  };

}

function getMultilineQuotes(node: ESBaseNode): MultilineMeta {
  const multilineQuotes: LiteralValueQuotes[] = ["'", "\""];

  return {
    multilineQuotes,
    surroundingBraces: false
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

function getVueMatcherFunctions(matchers: Matcher[]): MatcherFunctions<ESBaseNode> {
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
            (isESStringLike(node) || isVueLiteralNode(node))
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
