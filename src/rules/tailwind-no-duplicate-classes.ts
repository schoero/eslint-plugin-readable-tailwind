import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";
import {
  getCalleeSchema,
  getClassAttributeSchema,
  getTagsSchema,
  getVariableSchema
} from "readable-tailwind:options:descriptions.js";
import {
  getLiteralsByESCallExpression,
  getLiteralsByESVariableDeclarator,
  getLiteralsByTaggedTemplateExpression,
  hasESNodeParentExtension,
  isESCallExpression,
  isESVariableDeclarator
} from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "readable-tailwind:parsers:html.js";
import { getAttributesByJSXElement, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "readable-tailwind:parsers:vue.js";
import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";
import { splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node as ESNode, TaggedTemplateExpression, VariableDeclarator } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { AST } from "vue-eslint-parser";

import type { Literal } from "readable-tailwind:types:ast.js";
import type {
  CalleeOption,
  ClassAttributeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "readable-tailwind:types:rule.js";


export type Options = [
  Partial<
    CalleeOption &
    ClassAttributeOption &
    TagOption &
    VariableOption &
    {
      allowMultiline?: boolean;
    }
  >
];

const defaultOptions = {
  callees: DEFAULT_CALLEE_NAMES,
  classAttributes: DEFAULT_ATTRIBUTE_NAMES,
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

export const tailwindNoDuplicateClasses: ESLintRule<Options> = {
  name: "no-duplicate-classes" as const,
  rule: {
    create(ctx) {

      const { callees, classAttributes, tags, variables } = getOptions(ctx);

      const callExpression = {
        CallExpression(node: ESNode) {
          const callExpressionNode = node as CallExpression;

          const literals = getLiteralsByESCallExpression(ctx, callExpressionNode, callees);
          lintLiterals(ctx, literals);
        }
      };

      const variableDeclarators = {
        VariableDeclarator(node: ESNode) {
          const variableDeclaratorNode = node as VariableDeclarator;

          const literals = getLiteralsByESVariableDeclarator(ctx, variableDeclaratorNode, variables);
          lintLiterals(ctx, literals);
        }
      };

      const taggedTemplateExpression = {
        TaggedTemplateExpression(node: ESNode) {
          const taggedTemplateExpressionNode = node as TaggedTemplateExpression;

          const literals = getLiteralsByTaggedTemplateExpression(ctx, taggedTemplateExpressionNode, tags);
          lintLiterals(ctx, literals);
        }
      };

      const jsx = {
        JSXOpeningElement(node: ESNode) {
          const jsxNode = node as JSXOpeningElement;
          const jsxAttributes = getAttributesByJSXElement(ctx, jsxNode);

          for(const attribute of jsxAttributes){
            const literals = getLiteralsByJSXClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const svelte = {
        SvelteStartTag(node: ESNode) {
          const svelteNode = node as unknown as SvelteStartTag;
          const svelteAttributes = getAttributesBySvelteTag(ctx, svelteNode);

          for(const attribute of svelteAttributes){
            const literals = getLiteralsBySvelteClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const vue = {
        VStartTag(node: ESNode) {
          const vueNode = node as unknown as AST.VStartTag;
          const vueAttributes = getAttributesByVueStartTag(ctx, vueNode);

          for(const attribute of vueAttributes){
            const literals = getLiteralsByVueClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const html = {
        Tag(node: ESNode) {
          const htmlTagNode = node as unknown as TagNode;
          const htmlAttributes = getAttributesByHTMLTag(ctx, htmlTagNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getLiteralsByHTMLClassAttribute(ctx, htmlAttribute, classAttributes);
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
        ...html
      };

    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Disallow duplicate class names in tailwind classes.",
        recommended: true,
        url: "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/no-duplicate-classes.md"
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            ...getCalleeSchema(defaultOptions.callees),
            ...getClassAttributeSchema(defaultOptions.classAttributes),
            ...getVariableSchema(defaultOptions.variables),
            ...getTagsSchema(defaultOptions.tags)
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};

function lintLiterals(ctx: Rule.RuleContext, literals: Literal[]) {

  const duplicateRegister: {
    [literalPosition: string]: {
      classes: string[];
      duplicates: string[];
    };
  } = {};

  for(const literal of literals){

    const esNode = ctx.sourceCode.getNodeByRangeIndex(literal.range[0]);
    const parentLiteralNodes = esNode && findParentLiteralNodes(esNode);
    const parentLiterals = parentLiteralNodes && getLiteralsFromParentLiteralNodes(parentLiteralNodes, literals);
    const parentClasses = parentLiterals ? getClassesFromLiteralNodes(parentLiterals) : [];

    const duplicates: string[] = [];

    const classes = literal.content;

    const classChunks = splitClasses(classes);
    const whitespaceChunks = splitWhitespaces(classes);

    const finalChunks: string[] = [];

    const startsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[0] !== "";
    const endsWithWhitespace = whitespaceChunks.length > 0 && whitespaceChunks[whitespaceChunks.length - 1] !== "";

    for(let i = 0; i < whitespaceChunks.length; i++){

      if(whitespaceChunks[i]){
        finalChunks.push(whitespaceChunks[i]);
      }

      if(classChunks[i]){

        // always push sticky classes without adding to the register
        if(
          !startsWithWhitespace && i === 0 && literal.closingBraces ||
          !endsWithWhitespace && i === classChunks.length - 1 && literal.openingBraces
        ){
          finalChunks.push(classChunks[i]);
          continue;
        }

        if(parentClasses.includes(classChunks[i])){
          if(!duplicates.includes(classChunks[i])){
            duplicates.push(classChunks[i]);
          }
        } else {
          finalChunks.push(classChunks[i]);
          parentClasses.push(classChunks[i]);
        }
      }

    }

    const escapedClasses = escapeNestedQuotes(
      finalChunks.join(""),
      literal.openingQuote ?? "\""
    );

    const fixedClasses = [
      literal.openingQuote ?? "",
      literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
      escapedClasses,
      literal.type === "TemplateLiteral" && literal.openingBraces ? literal.openingBraces : "",
      literal.closingQuote ?? ""
    ].join("");

    if(literal.raw === fixedClasses){
      continue;
    }

    ctx.report({
      data: {
        duplicateClassname: duplicates.join(", ")
      },
      fix(fixer) {
        return fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: "Duplicate classname: \"{{ duplicateClassname }}\"."
    });

  }

}

function findParentLiteralNodes(node: ESNode) {

  if(!hasESNodeParentExtension(node)){ return; }

  const parentLiterals: ESNode[] = [];
  let currentNode: ESNode = node;

  while(hasESNodeParentExtension(currentNode)){
    const parent = currentNode.parent;

    if(isESCallExpression(parent)){ break; }
    if(isESVariableDeclarator(parent)){ break; }

    if(parent.type === "TemplateLiteral"){
      for(const quasi of parent.quasis){
        if(quasi.range === node.range){
          break;
        }

        if(quasi.type === "TemplateElement"){
          parentLiterals.push(quasi);
        }
      }
    }

    if(
      parent.type === "TemplateElement" ||
      parent.type === "Literal"
    ){
      parentLiterals.push(parent);
    }

    currentNode = parent;

  }

  return parentLiterals;

}

function getLiteralsFromParentLiteralNodes(parentLiteralNodes: ESNode[], literals: Literal[]) {
  return parentLiteralNodes.map(parentLiteralNode => {
    return literals.find(literal => literal.range === parentLiteralNode.range);
  });
}

function getClassesFromLiteralNodes(literals: (Literal | undefined)[]) {
  return literals.reduce<string[]>((combinedClasses, literal) => {
    if(!literal){ return combinedClasses; }

    const classes = literal.content;
    const split = splitClasses(classes);

    for(const className of split){
      if(!combinedClasses.includes(className)){
        combinedClasses.push(className);
      }
    }

    return combinedClasses;

  }, []);
}

function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const classAttributes = options.classAttributes ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.classAttributes ??
    ctx?.settings["readable-tailwind"]?.classAttributes ??
    defaultOptions.classAttributes;

  const callees = options.callees ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.callees ??
    ctx?.settings["readable-tailwind"]?.callees ??
    defaultOptions.callees;

  const variables = options.variables ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.variables ??
    ctx?.settings["readable-tailwind"]?.variables ??
    defaultOptions.variables;

  const tags = options.tags ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.tags ??
    ctx?.settings["readable-tailwind"]?.tags ??
    defaultOptions.tags;

  return {
    callees,
    classAttributes,
    tags,
    variables
  };

}
