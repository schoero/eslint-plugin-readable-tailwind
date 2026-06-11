import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { toJsonSchema } from "@valibot/to-json-schema";
import { getDefaults, strictObject } from "valibot";

import { COMMON_OPTIONS } from "better-tailwindcss:options/descriptions.js";
import { migrateLegacySelectorsToFlatSelectors } from "better-tailwindcss:options/migrate.js";
import { getAttributesByAngularElement, getLiteralsByAngularAttribute } from "better-tailwindcss:parsers/angular.js";
import { getLiteralsByCSSAtRule } from "better-tailwindcss:parsers/css.js";
import {
  getLiteralsByESBareTemplateLiteral,
  getLiteralsByESCallExpression,
  getLiteralsByESExportDefaultDeclaration,
  getLiteralsByESVariableDeclarator,
  getLiteralsByTaggedTemplateExpression
} from "better-tailwindcss:parsers/es.js";
import { getAttributesByHTMLTag, getLiteralsByHTMLAttribute } from "better-tailwindcss:parsers/html.js";
import { getAttributesByJSXElement, getLiteralsByJSXAttribute } from "better-tailwindcss:parsers/jsx.js";
import {
  getAttributesBySvelteTag,
  getDirectivesBySvelteTag,
  getLiteralsBySvelteAttribute,
  getLiteralsBySvelteDirective
} from "better-tailwindcss:parsers/svelte.js";
import { getAttributesByVueStartTag, getLiteralsByVueAttribute } from "better-tailwindcss:parsers/vue.js";
import { SelectorKind } from "better-tailwindcss:types/rule.js";
import { getLocByRange } from "better-tailwindcss:utils/ast.js";
import { resolveJson } from "better-tailwindcss:utils/resolvers.js";
import { augmentMessageWithWarnings, escapeMessage } from "better-tailwindcss:utils/utils.js";
import { removeDefaults } from "better-tailwindcss:utils/valibot.js";
import { parseSemanticVersion } from "better-tailwindcss:utils/version.js";
import { warnOnce } from "better-tailwindcss:utils/warn.js";

import type { TmplAstElement } from "@angular-eslint/bundled-angular-compiler";
import type { Atrule } from "@eslint/css-tree";
import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type {
  CallExpression,
  ExportDefaultDeclaration,
  Node,
  TaggedTemplateExpression,
  TemplateLiteral,
  VariableDeclarator
} from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";
import type { AST } from "vue-eslint-parser";

import type { CommonOptions } from "better-tailwindcss:options/descriptions.js";
import type { Literal } from "better-tailwindcss:types/ast.js";
import type {
  AttributeSelector,
  CalleeSelector,
  Context,
  CreateRuleOptions,
  ESLintRule,
  JsonSchema,
  RuleCategory,
  RuleContext,
  Schema,
  Selectors,
  TagSelector,
  VariableSelector
} from "better-tailwindcss:types/rule.js";


export function createRule<
  const Name extends string,
  const Messages extends Record<string, string>,
  const OptionsSchema extends Schema = Schema,
  const Options extends CommonOptions & JsonSchema<OptionsSchema> = CommonOptions & JsonSchema<OptionsSchema>,
  const Category extends RuleCategory = RuleCategory,
  const Recommended extends boolean = boolean
>(options: CreateRuleOptions<Name, Messages, OptionsSchema, Options, Category, Recommended>) {

  const { autofix, category, description, docs, initialize, lintLiterals, messages, name, recommended, schema } = options;

  let eslintContext: Rule.RuleContext | undefined;

  const propertiesSchema = strictObject({
    // eslint injects the defaults from the settings to options, if not specified in the options
    // because we want to have a specific order of precedence, we need to remove the defaults here and merge them
    // manually in getOptions. The order of precedence is:
    // 1. defaults from settings
    // 2. defaults from option
    // 3. configs from settings
    // 4. configs from option
    ...removeDefaults(COMMON_OPTIONS.entries),
    ...schema?.entries
  });

  const jsonSchema = toJsonSchema(propertiesSchema).properties;

  const getOptions = (): Options => {
    const defaultSettings = getDefaults(COMMON_OPTIONS);
    const defaultOptions = schema ? getDefaults(schema) : {};
    const settings = eslintContext?.settings?.["eslint-plugin-better-tailwindcss"] ?? eslintContext?.settings?.["better-tailwindcss"] ?? {};
    const options = eslintContext?.options[0] ?? {};

    const mergedOptions = {
      ...defaultSettings,
      ...defaultOptions,
      ...settings,
      ...options
    };

    const migratedSelectors = migrateLegacySelectorsToFlatSelectors({
      attributes: mergedOptions.attributes,
      callees: mergedOptions.callees,
      tags: mergedOptions.tags,
      variables: mergedOptions.variables
    });

    const hasAttributeOverride = mergedOptions.attributes !== undefined;
    const hasCalleeOverride = mergedOptions.callees !== undefined;
    const hasTagOverride = mergedOptions.tags !== undefined;
    const hasVariableOverride = mergedOptions.variables !== undefined;

    const preservedSelectors = (mergedOptions.selectors ?? []).filter(selector => {
      if(hasAttributeOverride && selector.kind === SelectorKind.Attribute){
        return false;
      }

      if(hasCalleeOverride && selector.kind === SelectorKind.Callee){
        return false;
      }

      if(hasTagOverride && selector.kind === SelectorKind.Tag){
        return false;
      }

      if(hasVariableOverride && selector.kind === SelectorKind.Variable){
        return false;
      }

      return true;
    });

    const selectors = [
      ...migratedSelectors,
      ...preservedSelectors
    ];

    return {
      ...mergedOptions,
      selectors
    };
  };

  return {
    category,
    messages,
    name,
    get options() { return getOptions(); },
    recommended,
    rule: {
      create: ctx => {

        eslintContext = ctx;

        const options = getOptions();

        const { messageStyle } = options;

        // #361#issuecomment-4227041592
        const cwd = options.cwd
          ? resolve(ctx.cwd, options.cwd)
          : ctx.cwd;

        const packageJsonPath = resolveJson("tailwindcss/package.json", cwd);

        if(!packageJsonPath){
          warnOnce(`Tailwind CSS is not installed. Disabling rule ${ctx.id}.`);
          return {};
        }

        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const version = parseSemanticVersion(packageJson.version);
        const installation = dirname(packageJsonPath);

        const context = {
          cwd,
          docs,
          installation,
          options,
          parserServices: ctx.sourceCode.parserServices,
          report: ({ fix, range, warnings, ...rest }) => {
            const loc = getLocByRange(ctx, range);

            if("id" in rest && rest.id && messages && rest.id in messages){
              return void ctx.report({
                data: rest.data,
                loc,
                ...fix !== undefined && {
                  fix: fixer => fixer.replaceTextRange(range, fix)
                },
                message: escapeMessage(messageStyle, augmentMessageWithWarnings(messages[rest.id], docs, warnings))
              });
            }

            if("message" in rest && rest.message){
              return void ctx.report({
                loc,
                ...fix !== undefined && {
                  fix: fixer => fixer.replaceTextRange(range, fix)
                },
                message: escapeMessage(messageStyle, augmentMessageWithWarnings(rest.message, docs, warnings))
              });
            }
          },
          version
        } satisfies RuleContext<Messages, Options>;

        initialize?.(context);

        return createRuleListener(eslintContext, context, lintLiterals);
      },
      meta: {
        docs: {
          description,
          recommended,
          url: docs
        },
        fixable: autofix ? "code" : undefined,
        schema: [
          {
            additionalProperties: false,
            properties: jsonSchema,
            type: "object"
          }
        ],
        type: category === "correctness" ? "problem" : "layout",
        ...messages && { messages }
      }
    }
  } satisfies ESLintRule<Name, Messages, Options, Category, Recommended>;
}

export function createRuleListener<Ctx extends Context>(ctx: Rule.RuleContext, context: Ctx, lintLiterals: (ctx: Ctx, literals: Literal[]) => void): Rule.RuleListener {

  const selectors = context.options.selectors as Selectors;

  const attributes: AttributeSelector[] = [];
  const callees: CalleeSelector[] = [];
  const tags: TagSelector[] = [];
  const variables: VariableSelector[] = [];

  for(const selector of selectors){
    switch (selector.kind){
      case SelectorKind.Attribute:
        attributes.push(selector);
        break;
      case SelectorKind.Callee:
        callees.push(selector);
        break;
      case SelectorKind.Tag:
        tags.push(selector);
        break;
      case SelectorKind.Variable:
        variables.push(selector);
        break;
    }
  }

  const callExpression = {
    CallExpression(node: Node) {
      const callExpressionNode = node as CallExpression;

      const literals = getLiteralsByESCallExpression(ctx, callExpressionNode, callees);

      if(literals.length > 0){
        lintLiterals(context, literals);
      }
    }
  };

  const variableDeclarators = {
    VariableDeclarator(node: Node) {
      const variableDeclaratorNode = node as VariableDeclarator;

      const literals = getLiteralsByESVariableDeclarator(ctx, variableDeclaratorNode, variables);

      if(literals.length > 0){
        lintLiterals(context, literals);
      }
    }
  };

  const exportDefaultDeclarations = {
    ExportDefaultDeclaration(node: Node) {
      const exportDefaultDeclarationNode = node as ExportDefaultDeclaration;

      const literals = getLiteralsByESExportDefaultDeclaration(ctx, exportDefaultDeclarationNode, variables);

      if(literals.length > 0){
        lintLiterals(context, literals);
      }
    }
  };

  const taggedTemplateExpression = {
    TaggedTemplateExpression(node: Node) {
      const taggedTemplateExpressionNode = node as TaggedTemplateExpression;

      const literals = getLiteralsByTaggedTemplateExpression(ctx, taggedTemplateExpressionNode, tags);

      if(literals.length > 0){
        lintLiterals(context, literals);
      }
    }
  };

  const bareTemplateLiteral = {
    TemplateLiteral(node: Node) {
      const templateLiteralNode = node as TemplateLiteral;

      const literals = getLiteralsByESBareTemplateLiteral(ctx, templateLiteralNode, tags);

      if(literals.length > 0){
        lintLiterals(context, literals);
      }
    }
  };

  const jsx = {
    JSXOpeningElement(node: Node) {
      const jsxNode = node as JSXOpeningElement;
      const jsxAttributes = getAttributesByJSXElement(ctx, jsxNode);

      for(const jsxAttribute of jsxAttributes){

        const attributeValue = jsxAttribute.value;

        if(!attributeValue){ continue; }

        const literals = getLiteralsByJSXAttribute(ctx, jsxAttribute, attributes);

        if(literals.length > 0){
          lintLiterals(context, literals);
        }
      }
    }
  };

  const svelte = {
    SvelteStartTag(node: Node) {
      const svelteNode = node as unknown as SvelteStartTag;
      const svelteAttributes = getAttributesBySvelteTag(ctx, svelteNode);
      const svelteDirectives = getDirectivesBySvelteTag(ctx, svelteNode);

      for(const svelteAttribute of svelteAttributes){
        const attributeName = svelteAttribute.key.name;

        if(typeof attributeName !== "string"){ continue; }

        const literals = getLiteralsBySvelteAttribute(ctx, svelteAttribute, attributes);

        if(literals.length > 0){
          lintLiterals(context, literals);
        }
      }

      for(const svelteDirective of svelteDirectives){
        const literals = getLiteralsBySvelteDirective(ctx, svelteDirective, attributes);

        if(literals.length > 0){
          lintLiterals(context, literals);
        }
      }
    }
  };

  const vue = {
    VStartTag(node: Node) {
      const vueNode = node as unknown as AST.VStartTag;
      const vueAttributes = getAttributesByVueStartTag(ctx, vueNode);

      for(const attribute of vueAttributes){
        const literals = getLiteralsByVueAttribute(ctx, attribute, attributes);

        if(literals.length > 0){
          lintLiterals(context, literals);
        }
      }
    }
  };

  const html = {
    Tag(node: Node) {
      const htmlTagNode = node as unknown as TagNode;
      const htmlAttributes = getAttributesByHTMLTag(ctx, htmlTagNode);

      for(const htmlAttribute of htmlAttributes){
        const literals = getLiteralsByHTMLAttribute(ctx, htmlAttribute, attributes);

        if(literals.length > 0){
          lintLiterals(context, literals);
        }
      }
    }
  };

  const angular = {
    Element(node: Node) {
      const angularElementNode = node as unknown as TmplAstElement;
      const angularAttributes = getAttributesByAngularElement(ctx, angularElementNode);

      for(const angularAttribute of angularAttributes){
        const literals = getLiteralsByAngularAttribute(ctx, angularAttribute, attributes);

        if(literals.length > 0){
          lintLiterals(context, literals);
        }
      }
    }
  };

  const css = {
    Atrule(node: Node) {
      const atRuleNode = node as unknown as Atrule;

      const literals = getLiteralsByCSSAtRule(ctx, atRuleNode);

      if(literals.length > 0){
        lintLiterals(context, literals);
      }
    }
  };

  // Vue
  if(typeof ctx.sourceCode.parserServices?.defineTemplateBodyVisitor === "function"){
    return {
      // script tag
      ...callExpression,
      ...variableDeclarators,
      ...bareTemplateLiteral,
      ...exportDefaultDeclarations,
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
    ...bareTemplateLiteral,
    ...exportDefaultDeclarations,
    ...taggedTemplateExpression,
    ...jsx,
    ...svelte,
    ...vue,
    ...html,
    ...angular,
    ...css
  };
}
