import { getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";
import type { Node as ESTreeNode } from "estree-jsx";
import type { AST } from "vue-eslint-parser";

import type { Literal, Node, StringLiteral } from "readable-tailwind:types:ast.js";


export function getAttributesByVueStartTag(ctx: Rule.RuleContext, classAttributes: string[], node: AST.VStartTag): AST.VAttribute[] {
  return node.attributes.reduce<AST.VAttribute[]>((acc, attribute) => {
    if(isVueAttribute(attribute) && classAttributes.includes(attribute.key.name)){
      acc.push(attribute);
    }
    return acc;
  }, []);
}


export function getLiteralsByVueClassAttribute(ctx: Rule.RuleContext, attribute: AST.VAttribute): Literal[] {

  if(attribute.value === null){
    return [];
  }

  const value = attribute.value;
  const stringLiteral = getStringLiteralByVueStringLiteral(ctx, value);

  if(stringLiteral){
    return [stringLiteral];
  }

  return [];

}

function getStringLiteralByVueStringLiteral(ctx: Rule.RuleContext, node: AST.VLiteral): StringLiteral | undefined {

  const content = node.value;
  const raw = ctx.sourceCode.getText(node as unknown as ESTreeNode);

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return {
    ...whitespaces,
    ...quotes,
    content,
    loc: node.loc,
    parent: node.parent as unknown as Node,
    range: [node.range[0], node.range[1]],
    raw,
    type: "StringLiteral"
  };

}

function isVueAttribute(attribute: AST.VAttribute | AST.VDirective): attribute is AST.VAttribute {
  return "key" in attribute && "name" in attribute.key && typeof attribute.key.name === "string";
}
