import { DEFAULT_ATTRIBUTE_NAMES, DEFAULT_CALLEE_NAMES, DEFAULT_VARIABLE_NAMES } from "src/config/default-config.js";

import { getCalleeSchema, getClassAttributeSchema, getVariableSchema } from "readable-tailwind:config:descriptions.js";
import { getLiteralsByESCallExpression, getLiteralsByESVariableDeclarator } from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "readable-tailwind:parsers:html.js";
import { getAttributesByJSXElement, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "readable-tailwind:parsers:vue.js";
import { splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node, VariableDeclarator } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { AST } from "vue-eslint-parser";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { CalleeOption, ClassAttributeOption, ESLintRule, VariableOption } from "readable-tailwind:types:rule.js";


export type Options = [
  Partial<
    CalleeOption &
    ClassAttributeOption &
    VariableOption &
    {
      allowMultiline?: boolean;
    }
  >
];

export const tailwindNoUnnecessaryWhitespace: ESLintRule<Options> = {
  name: "no-unnecessary-whitespace" as const,
  rule: {
    create(ctx) {

      const { callees, classAttributes, variables } = getOptions(ctx);

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

      const jsx = {
        JSXOpeningElement(node: Node) {
          const jsxNode = node as JSXOpeningElement;
          const jsxAttributes = getAttributesByJSXElement(ctx, jsxNode);

          for(const attribute of jsxAttributes){
            const literals = getLiteralsByJSXClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const svelte = {
        SvelteStartTag(node: Node) {
          const svelteNode = node as unknown as SvelteStartTag;
          const svelteAttributes = getAttributesBySvelteTag(ctx, svelteNode);

          for(const attribute of svelteAttributes){
            const literals = getLiteralsBySvelteClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const vue = {
        VStartTag(node: Node) {
          const vueNode = node as unknown as AST.VStartTag;
          const vueAttributes = getAttributesByVueStartTag(ctx, vueNode);

          for(const attribute of vueAttributes){
            const literals = getLiteralsByVueClassAttribute(ctx, attribute, classAttributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const html = {
        Tag(node: Node) {
          const htmlTagNode = node as unknown as TagNode;
          const htmlAttributes = getAttributesByHTMLTag(ctx, htmlTagNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getLiteralsByHTMLClassAttribute(ctx, htmlAttribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      // Vue
      if(typeof ctx.sourceCode.parserServices?.defineTemplateBodyVisitor === "function"){
        return {
          ...callExpression,
          ...variableDeclarators,
          ...ctx.sourceCode.parserServices.defineTemplateBodyVisitor(vue)
        };
      }

      return {
        ...callExpression,
        ...variableDeclarators,
        ...jsx,
        ...svelte,
        ...html
      };

    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Disallow unnecessary whitespace in tailwind classes.",
        recommended: true,
        url: "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/no-unnecessary-whitespace.md"
      },
      fixable: "whitespace",
      schema: [
        {
          additionalProperties: false,
          properties: {
            allowMultiline: {
              default: getOptions().allowMultiline,
              description: "Allow multi-line class declarations. If this option is disabled, template literal strings will be collapsed into a single line string wherever possible. Must be set to `true` when used in combination with [readable-tailwind/multiline](./multiline.md).",
              type: "boolean"
            },
            ...getCalleeSchema(getOptions().callees),
            ...getClassAttributeSchema(getOptions().classAttributes),
            ...getVariableSchema(getOptions().variables)
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};

function lintLiterals(ctx: Rule.RuleContext, literals: Literal[]) {

  const { allowMultiline } = getOptions(ctx);

  for(const literal of literals){

    const classes = splitClassesKeepWhitespace(literal, allowMultiline);

    const fixedClasses = [
      literal.openingQuote ?? "",
      literal.type === "TemplateLiteral" && literal.closingBraces ? literal.closingBraces : "",
      ...classes,
      literal.type === "TemplateLiteral" && literal.openingBraces ? literal.openingBraces : "",
      literal.closingQuote ?? ""
    ].join("");

    if(literal.raw === fixedClasses){
      continue;
    }

    ctx.report({
      data: {
        unnecessaryWhitespace: literal.content
      },
      fix(fixer) {
        return fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: "Unnecessary whitespace: \"{{ unnecessaryWhitespace }}\"."
    });

  }

}

function splitClassesKeepWhitespace(literal: Literal, allowMultiline: boolean): string[] {

  const classes = literal.content;

  const classChunks = splitClasses(classes);
  const whitespaceChunks = splitWhitespaces(classes);

  const mixedChunks: string[] = [];

  if(classChunks.length === 0 && !literal.closingBraces && !literal.openingBraces){
    return [];
  }

  while(whitespaceChunks.length > 0 || classChunks.length > 0){

    const whitespaceChunk = whitespaceChunks.shift();
    const classChunk = classChunks.shift();

    const isFirstChunk = mixedChunks.length === 0;
    const isLastChunk = whitespaceChunks.length === 0 && classChunks.length === 0;

    if(whitespaceChunk){
      if(whitespaceChunk.includes("\n") && allowMultiline === true){
        const whitespaceWithoutLeadingSpaces = whitespaceChunk.replace(/^ +/, "");
        mixedChunks.push(whitespaceWithoutLeadingSpaces);
      } else {
        if(!isFirstChunk && !isLastChunk ||
          literal.type === "TemplateLiteral" && literal.closingBraces && isFirstChunk && !isLastChunk ||
          literal.type === "TemplateLiteral" && literal.openingBraces && isLastChunk && !isFirstChunk){
          mixedChunks.push(" ");
        }
      }
    }

    if(classChunk){
      mixedChunks.push(classChunk);
    }

  }

  return mixedChunks;

}

function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const classAttributes = options.classAttributes ?? DEFAULT_ATTRIBUTE_NAMES;
  const allowMultiline = options.allowMultiline ?? true;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;
  const variables = options.variables ?? DEFAULT_VARIABLE_NAMES;

  return {
    allowMultiline,
    callees,
    classAttributes,
    variables
  };

}
