import { getAttributesByAngularElement, getLiteralsByAngularAttributes } from "readable-tailwind:parsers:angular.js";
import {
  getLiteralsByESCallExpression,
  getLiteralsByESVariableDeclarator,
  getLiteralsByTaggedTemplateExpression
} from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLAttribute } from "readable-tailwind:parsers:html.js";
import { getAttributesByJSXElement, getLiteralsByJSXAttribute } from "readable-tailwind:parsers:jsx.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteAttribute } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueAttribute } from "readable-tailwind:parsers:vue.js";

import type { TmplAstElement } from "@angular-eslint/bundled-angular-compiler";
import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node, TaggedTemplateExpression, VariableDeclarator } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { AST } from "vue-eslint-parser";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { AttributeOption, CalleeOption, TagOption, VariableOption } from "readable-tailwind:types:rule.js";


export type Options =
  AttributeOption &
  CalleeOption &
  TagOption &
  VariableOption;

export function createRuleListener(ctx: Rule.RuleContext, options: Options, lintLiterals: (ctx: Rule.RuleContext, literals: Literal[]) => void): Rule.RuleListener {
  const { attributes, callees, tags, variables } = options;

  const callExpression = {
    CallExpression(node: Node) {
      const callExpressionNode = node as CallExpression;

      const literals = getLiteralsByESCallExpression(ctx, callExpressionNode, callees);
      lintLiterals(ctx, literals);
    }
  };

  const variableDeclarators = {
    VariableDeclarator(node: Node) {
      const variableDeclaratorNode = node as VariableDeclarator;

      const literals = getLiteralsByESVariableDeclarator(ctx, variableDeclaratorNode, variables);
      lintLiterals(ctx, literals);
    }
  };

  const taggedTemplateExpression = {
    TaggedTemplateExpression(node: Node) {
      const taggedTemplateExpressionNode = node as TaggedTemplateExpression;

      const literals = getLiteralsByTaggedTemplateExpression(ctx, taggedTemplateExpressionNode, tags);
      lintLiterals(ctx, literals);
    }
  };

  const jsx = {
    JSXOpeningElement(node: Node) {
      const jsxNode = node as JSXOpeningElement;
      const jsxAttributes = getAttributesByJSXElement(ctx, jsxNode);

      for(const jsxAttribute of jsxAttributes){

        const attributeValue = jsxAttribute.value;
        const attributeName = jsxAttribute.name.name;

        if(!attributeValue){ continue; }
        if(typeof attributeName !== "string"){ continue; }

        const literals = getLiteralsByJSXAttribute(ctx, jsxAttribute, attributes);
        lintLiterals(ctx, literals);
      }
    }
  };

  const svelte = {
    SvelteStartTag(node: Node) {
      const svelteNode = node as unknown as SvelteStartTag;
      const svelteAttributes = getAttributesBySvelteTag(ctx, svelteNode);

      for(const svelteAttribute of svelteAttributes){
        const attributeName = svelteAttribute.key.name;

        if(typeof attributeName !== "string"){ continue; }

        const literals = getLiteralsBySvelteAttribute(ctx, svelteAttribute, attributes);
        lintLiterals(ctx, literals);
      }
    }
  };

  const vue = {
    VStartTag(node: Node) {
      const vueNode = node as unknown as AST.VStartTag;
      const vueAttributes = getAttributesByVueStartTag(ctx, vueNode);

      for(const attribute of vueAttributes){
        const literals = getLiteralsByVueAttribute(ctx, attribute, attributes);
        lintLiterals(ctx, literals);
      }
    }
  };

  const html = {
    Tag(node: Node) {
      const htmlTagNode = node as unknown as TagNode;
      const htmlAttributes = getAttributesByHTMLTag(ctx, htmlTagNode);

      for(const htmlAttribute of htmlAttributes){
        const literals = getLiteralsByHTMLAttribute(ctx, htmlAttribute, attributes);
        lintLiterals(ctx, literals);
      }
    }
  };

  const angular = {
    Element$1(node: Node) {
      const angularElementNode = node as unknown as TmplAstElement;
      const angularAttributes = getAttributesByAngularElement(ctx, angularElementNode);
      for(const angularAttribute of angularAttributes){
        const literals = getLiteralsByAngularAttributes(ctx, angularAttribute, attributes);
        lintLiterals(ctx, literals);
      }
    }
  };

  // Vue
  if(typeof ctx.sourceCode.parserServices?.defineTemplateBodyVisitor === "function"){
    return {
      // script tag
      ...callExpression,
      ...variableDeclarators,
      ...taggedTemplateExpression,

      // bound classes
      ...ctx.sourceCode.parserServices.defineTemplateBodyVisitor({
        ...callExpression,
        ...vue
      })
    };
  }

  return {
    ...callExpression,
    ...variableDeclarators,
    ...taggedTemplateExpression,
    ...jsx,
    ...svelte,
    ...vue,
    ...html,
    ...angular
  };
}
