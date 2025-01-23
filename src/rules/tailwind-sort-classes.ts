import { getClassOrder } from "readable-tailwind:async:class-order.sync.js";
import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";
import {
  getAttributesSchema,
  getCalleeSchema,
  getTagsSchema,
  getVariableSchema
} from "readable-tailwind:options:descriptions.js";
import {
  getLiteralsByESCallExpression,
  getLiteralsByESVariableDeclarator,
  getLiteralsByTaggedTemplateExpression
} from "readable-tailwind:parsers:es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLAttributes } from "readable-tailwind:parsers:html.js";
import { getAttributesByJSXElement, getLiteralsByJSXAttributes } from "readable-tailwind:parsers:jsx.js";
import { getAttributesBySvelteTag, getLiteralsBySvelteAttributes } from "readable-tailwind:parsers:svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueAttributes } from "readable-tailwind:parsers:vue.js";
import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";
import { display, splitClasses, splitWhitespaces } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { CallExpression, Node, TaggedTemplateExpression, VariableDeclarator } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { AST } from "vue-eslint-parser";

import type { Literal } from "readable-tailwind:types:ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "readable-tailwind:types:rule.js";


export type Options = [
  Partial<
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      order?: "asc" | "desc" | "improved" | "official" ;
      tailwindConfig?: string;
    }
  >
];

const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  order: "improved",
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

export const tailwindSortClasses: ESLintRule<Options> = {
  name: "sort-classes" as const,
  rule: {
    create(ctx) {

      const { attributes, callees, tags, variables } = getOptions(ctx);

      const lintLiterals = (ctx: Rule.RuleContext, literals: Literal[]) => {

        for(const literal of literals){

          const classChunks = splitClasses(literal.content);
          const whitespaceChunks = splitWhitespaces(literal.content);

          const unsortableClasses: [string, string] = ["", ""];

          // remove sticky classes
          if(literal.closingBraces && whitespaceChunks[0] === ""){
            whitespaceChunks.shift();
            unsortableClasses[0] = classChunks.shift() ?? "";
          }
          if(literal.openingBraces && whitespaceChunks[whitespaceChunks.length - 1] === ""){
            whitespaceChunks.pop();
            unsortableClasses[1] = classChunks.pop() ?? "";
          }

          const sortedClassChunks = sortClasses(ctx, classChunks);

          const classes: string[] = [];

          for(let i = 0; i < Math.max(sortedClassChunks.length, whitespaceChunks.length); i++){
            whitespaceChunks[i] && classes.push(whitespaceChunks[i]);
            sortedClassChunks[i] && classes.push(sortedClassChunks[i]);
          }

          const escapedClasses = escapeNestedQuotes(
            [
              unsortableClasses[0],
              ...classes,
              unsortableClasses[1]
            ].join(""),
            literal.openingQuote ?? "`"
          );

          const fixedClasses =
            [
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
              notSorted: display(literal.raw),
              sorted: display(fixedClasses)
            },
            fix(fixer) {
              return fixer.replaceTextRange(literal.range, fixedClasses);
            },
            loc: literal.loc,
            message: "Incorrect class order. Expected\n\n{{ notSorted }}\n\nto be\n\n{{ sorted }}"
          });

        }
      };

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

          for(const attribute of jsxAttributes){
            const literals = getLiteralsByJSXAttributes(ctx, attribute, attributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const svelte = {
        SvelteStartTag(node: Node) {
          const svelteNode = node as unknown as SvelteStartTag;
          const svelteAttributes = getAttributesBySvelteTag(ctx, svelteNode);

          for(const attribute of svelteAttributes){
            const literals = getLiteralsBySvelteAttributes(ctx, attribute, attributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const vue = {
        VStartTag(node: Node) {
          const vueNode = node as unknown as AST.VStartTag;
          const vueAttributes = getAttributesByVueStartTag(ctx, vueNode);

          for(const attribute of vueAttributes){
            const literals = getLiteralsByVueAttributes(ctx, attribute, attributes);
            lintLiterals(ctx, literals);
          }
        }
      };

      const html = {
        Tag(node: Node) {
          const htmlNode = node as unknown as TagNode;
          const htmlAttributes = getAttributesByHTMLTag(ctx, htmlNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getLiteralsByHTMLAttributes(ctx, htmlAttribute, attributes);
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
        description: "Enforce a consistent order for tailwind classes.",
        recommended: true,
        url: "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/sort-classes.md"
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            ...getCalleeSchema(defaultOptions.callees),
            ...getAttributesSchema(defaultOptions.attributes),
            ...getVariableSchema(defaultOptions.variables),
            ...getTagsSchema(defaultOptions.tags),
            order: {
              default: defaultOptions.order,
              description: "The algorithm to use when sorting classes.",
              enum: [
                "asc",
                "desc",
                "official",
                "improved"
              ],
              type: "string"
            },
            tailwindConfig: {
              description: "The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.",
              type: "string"
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};


function sortClasses(ctx: Rule.RuleContext, classes: string[]): string[] {

  const { order, tailwindConfig } = getOptions(ctx);

  if(order === "asc"){
    return [...classes].sort((a, b) => a.localeCompare(b));
  }

  if(order === "desc"){
    return [...classes].sort((a, b) => b.localeCompare(a));
  }

  const officialClassOrder = getClassOrder({ classes, configPath: tailwindConfig, cwd: ctx.cwd });
  const officiallySortedClasses = [...officialClassOrder]
    .sort(([, a], [, z]) => {
      if(a === z){ return 0; }
      if(a === null){ return 1; }
      if(z === null){ return 1; }
      return +(a - z > 0n) - +(a - z < 0n);
    })
    .map(([className]) => className);

  if(order === "official"){
    return officiallySortedClasses;
  }

  return [...officiallySortedClasses].sort((a, b) => {

    const aModifier = a.match(/^.*?:/)?.[0];
    const bModifier = b.match(/^.*?:/)?.[0];

    if(aModifier && bModifier && aModifier !== bModifier){
      return aModifier.localeCompare(bModifier);
    }

    if(aModifier && !bModifier){
      return 1;
    }
    if(!aModifier && bModifier){
      return -1;
    }

    return 0;

  });

}


export function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const order = options.order ?? defaultOptions.order;

  const attributes = options.attributes ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.attributes ??
    ctx?.settings["readable-tailwind"]?.attributes ??
    defaultOptions.attributes;

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

  const tailwindConfig = options.tailwindConfig ??
    ctx?.settings["eslint-plugin-readable-tailwind"]?.entryPoint ??
    ctx?.settings["readable-tailwind"]?.entryPoint;

  return {
    attributes,
    callees,
    order,
    tags,
    tailwindConfig,
    variables
  };

}
