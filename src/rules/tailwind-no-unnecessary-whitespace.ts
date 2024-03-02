import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "src/parsers/html.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "src/parsers/svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "src/parsers/vue.js";

import { getLiteralsByESCallExpression } from "readable-tailwind:parsers:es.js";
import { getJSXAttributes, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx";
import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "readable-tailwind:utils:config.js";
import { splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { VStartTag } from "vue-eslint-parser/ast";

import type { Literal } from "readable-tailwind:types:ast.js";
import type { Callees, ESLintRule } from "readable-tailwind:types:rule.js";


export type Options = [
  {
    allowMultiline?: boolean;
    callees?: Callees;
    classAttributes?: string[];
  }
];

export const tailwindNoUnnecessaryWhitespace: ESLintRule<Options> = {
  name: "no-unnecessary-whitespace" as const,
  rule: {
    create(ctx) {

      const { callees, classAttributes } = getOptions(ctx);

      const callExpression = {
        CallExpression(node: Node) {
          const callExpressionNode = node as CallExpression;

          const literals = getLiteralsByESCallExpression(ctx, callExpressionNode, callees);
          lintLiterals(ctx, literals);
        }
      };

      const jsx = {
        JSXOpeningElement(node: Node) {
          const jsxNode = node as JSXOpeningElement;
          const jsxAttributes = getJSXAttributes(ctx, classAttributes, jsxNode);

          for(const attribute of jsxAttributes){
            const literals = getLiteralsByJSXClassAttribute(ctx, attribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      const svelte = {
        SvelteStartTag(node: Node) {
          const svelteNode = node as unknown as SvelteStartTag;
          const svelteAttributes = getAttributesBySvelteTag(ctx, classAttributes, svelteNode);

          for(const attribute of svelteAttributes){
            const literals = getLiteralsBySvelteClassAttribute(ctx, attribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      const vue = {
        VStartTag(node: Node) {
          const vueNode = node as unknown as VStartTag;
          const vueAttributes = getAttributesByVueStartTag(ctx, classAttributes, vueNode);

          for(const attribute of vueAttributes){
            const literals = getLiteralsByVueClassAttribute(ctx, attribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      const html = {
        Tag(node: Node) {
          const htmlTagNode = node as unknown as TagNode;
          const htmlAttributes = getAttributesByHTMLTag(ctx, classAttributes, htmlTagNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getLiteralsByHTMLClassAttribute(ctx, htmlAttribute);
            lintLiterals(ctx, literals);
          }
        }
      };

      // Vue
      if(typeof ctx.parserServices?.defineTemplateBodyVisitor === "function"){
        return {
          ...callExpression,
          ...ctx.parserServices.defineTemplateBodyVisitor(vue)
        };
      }

      return {
        ...callExpression,
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
            callees: {
              default: getOptions().callees,
              description: "List of function names whose arguments should also be considered.",
              items: {
                anyOf: [
                  {
                    description: "List of regular expressions that matches string literals that should also be considered.",
                    items: [
                      { description: "Regular expression that filters the callee and matches the string literals in a group.", type: "string" },
                      { description: "Regular expression that matches each string literal in a group.", type: "string" }
                    ],
                    type: "array"
                  },
                  {
                    description: "List of function names whose arguments should also be considered.",
                    type: "string"
                  }
                ]
              },
              type: "array"
            },
            classAttributes: {
              default: getOptions().classAttributes,
              description: "The name of the attribute that contains the tailwind classes.",
              items: {
                type: "string"
              },
              type: "array"
            }
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

  while(whitespaceChunks.length > 0 || classChunks.length > 0){

    const whitespaceChunk = whitespaceChunks.shift();
    const classChunk = classChunks.shift();

    const isFirstChunk = mixedChunks.length === 0;
    const isLastChunk = whitespaceChunks.length === 0 && classChunks.length === 0;

    if(whitespaceChunk){
      if(whitespaceChunk.includes("\n") && allowMultiline === true){
        mixedChunks.push(whitespaceChunk);
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

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const allowMultiline = options.allowMultiline ?? true;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;

  return {
    allowMultiline,
    callees,
    classAttributes
  };

}
