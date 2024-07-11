import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";
import {
  getCalleeSchema,
  getClassAttributeSchema,
  getVariableSchema
} from "readable-tailwind:options:descriptions.js";
import { getLiteralsByESCallExpression, getLiteralsByESVariableDeclarator } from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLClassAttribute } from "readable-tailwind:parsers:html.js";
import { getAttributesByJSXElement, getLiteralsByJSXClassAttribute } from "readable-tailwind:parsers:jsx.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteClassAttribute } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueClassAttribute } from "readable-tailwind:parsers:vue.js";
import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";
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

export const tailwindNoDuplicateClasses: ESLintRule<Options> = {
  name: "no-duplicate-classes" as const,
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

  const duplicateRegister: {
    [literalPosition: string]: {
      classes: string[];
      duplicates: string[];
    };
  } = {};

  for(const literal of literals){

    // duplicates separated by expressions
    const registerKey = literal.type === "StringLiteral"
      ? `${literal.loc.start.line}${literal.loc.start.column}`
      : `${literal.parent.loc.start.line}${literal.parent.loc.start.column}`;

    duplicateRegister[registerKey] ??= { classes: [], duplicates: [] };

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

        if(duplicateRegister[registerKey].classes.includes(classChunks[i])){
          if(!duplicateRegister[registerKey].duplicates.includes(classChunks[i])){
            duplicateRegister[registerKey].duplicates.push(classChunks[i]);
          }
        } else {
          finalChunks.push(classChunks[i]);
          duplicateRegister[registerKey].classes.push(classChunks[i]);
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
        duplicateClassname: duplicateRegister[registerKey].duplicates.join()
      },
      fix(fixer) {
        return fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: "Duplicate classname: \"{{ duplicateClassname }}\"."
    });

  }

}


function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const classAttributes = options.classAttributes ?? DEFAULT_ATTRIBUTE_NAMES;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;
  const variables = options.variables ?? DEFAULT_VARIABLE_NAMES;

  return {
    callees,
    classAttributes,
    variables
  };

}
