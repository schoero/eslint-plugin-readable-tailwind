import { ident, parse, walk } from "@eslint/css-tree";

import { matchCSSApplyDirective } from "better-tailwindcss:parsers/css.js";
import { getLiteralsByESCallExpression } from "better-tailwindcss:parsers/es.js";
import { SelectorKind } from "better-tailwindcss:types/rule.js";
import { getCachedRegex } from "better-tailwindcss:utils/regex.js";
import { getIndentation, getWhitespace } from "better-tailwindcss:utils/utils.js";

import type { CssNode } from "@eslint/css-tree";
import type { Rule } from "eslint";
import type { CallExpression } from "estree";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type {
  CalleeSelector,
  StyleCalleeSelector,
  StyleElementSelector,
  StyleSelector
} from "better-tailwindcss:types/rule.js";


/** A blob of CSS embedded in a non-css file (e.g. A Svelte `<style>` block or a Qwik `useStylesScoped/** A blob of CSS embedded in a non-css file (e.g argument). */
export interface StyleSource {
  cssText: string;
  range: [number, number];
}

export type GetStyleSources = () => StyleSource[];
export type GetStyleSourceClassNames = () => Set<string>;

export let getStyleSources: GetStyleSources = () => [];
export let getStyleSourceClassNames: GetStyleSourceClassNames = () => new Set();

export function createGetStyleSources(ctx: Rule.RuleContext, selectors: StyleSelector[]): void {
  let sourcesCache: StyleSource[] | undefined;
  let classNamesCache: Set<string> | undefined;

  getStyleSources = () => {
    return sourcesCache ??= collectStyleSources(ctx, selectors);
  };

  getStyleSourceClassNames = () => {
    return classNamesCache ??= collectClassNames(getStyleSources());
  };
}

/**
 * Extracts the class lists of `@apply` directives declared inside a scoped style source so all rules can lint them.
 *
 * @param ctx
 * @param source
 * @returns
 */
export function getLiteralsByStyleSource(ctx: Rule.RuleContext, source: StyleSource): Literal[] {
  const ast = parseCSS(source.cssText);

  if(!ast){
    return [];
  }

  const literals: Literal[] = [];

  walk(ast, node => {
    if(node.type !== "Atrule" || node.name !== "apply" || !node.loc){
      return;
    }

    const nodeRaw = source.cssText.slice(node.loc.start.offset, node.loc.end.offset);
    const match = matchCSSApplyDirective(nodeRaw);

    if(!match){
      return;
    }

    const { content, leadingApply, trailingSemicolon } = match;

    const start = source.range[0] + node.loc.start.offset + leadingApply.length;
    const end = source.range[0] + node.loc.end.offset - trailingSemicolon.length;

    const loc = {
      end: ctx.sourceCode.getLocFromIndex(end),
      start: ctx.sourceCode.getLocFromIndex(start)
    };

    const indentation = getIndentation(ctx.sourceCode.lines[loc.start.line - 1]);
    const whitespaces = getWhitespace(content);

    literals.push({
      ...whitespaces,
      content,
      indentation,
      isInterpolated: false,
      leadingApply,
      loc,
      range: [start, end],
      raw: content,
      supportsMultiline: true,
      trailingSemicolon,
      type: "CSSClassListLiteral"
    });
  });

  return literals;
}

function collectStyleSources(ctx: Rule.RuleContext, selectors: StyleSelector[]): StyleSource[] {
  const elementSelectors = selectors.filter(isStyleElementSelector);
  const calleeSelectors = selectors
    .filter(isStyleCalleeSelector)
    .map<CalleeSelector>(selector => ({ ...selector, kind: SelectorKind.Callee }));

  if(elementSelectors.length === 0 && calleeSelectors.length === 0){
    return [];
  }

  const sources: StyleSource[] = [];

  walkNode(ctx.sourceCode.ast, node => {
    if(elementSelectors.length > 0 && isMarkupStyleElement(node, elementSelectors)){
      const source = getMarkupStyleSource(ctx, node);

      if(source){
        sources.push(source);
      }
    }

    if(calleeSelectors.length > 0 && node.type === "CallExpression"){
      const literals = getLiteralsByESCallExpression(ctx, node as CallExpression, calleeSelectors);

      for(const literal of literals){
        if(literal.isInterpolated){ continue; }

        sources.push({ cssText: literal.content, range: literal.range });
      }
    }
  });

  return sources;
}

function collectClassNames(sources: StyleSource[]): Set<string> {
  const classNames = new Set<string>();

  for(const source of sources){
    const ast = parseCSS(source.cssText);

    if(!ast){ continue; }

    extractClassSelectors(ast, classNames);
  }

  return classNames;
}

function extractClassSelectors(node: CssNode, classNames: Set<string>): void {
  walk(node, selectorNode => {
    if(selectorNode.type === "ClassSelector"){
      classNames.add(ident.decode(selectorNode.name));
      return;
    }

    // `:global(...)` and other pseudo-classes keep their argument as a raw, unparsed selector - reparse it to detect nested classes.
    if(selectorNode.type === "PseudoClassSelector" && selectorNode.children){
      selectorNode.children.forEach(child => {
        if(child.type !== "Raw"){ return; }

        const selectorAst = parseCSS(child.value, "selectorList");

        if(selectorAst){
          extractClassSelectors(selectorAst, classNames);
        }
      });
    }
  });
}

function getMarkupStyleSource(ctx: Rule.RuleContext, node: any): StyleSource | undefined {
  const start = node.startTag?.range?.[1];
  const end = node.endTag?.range?.[0];

  if(typeof start !== "number" || typeof end !== "number" || end <= start){
    return;
  }

  const text = ctx.sourceCode.getText();

  // only plain css is understood - skip preprocessor languages like scss, sass or less.
  const startTagText = text.slice(node.startTag.range[0], node.startTag.range[1]);
  const langMatch = startTagText.match(/\blang\s*=\s*["']?\s*([a-z]+)/i);

  if(langMatch && langMatch[1].toLowerCase() !== "css"){
    return;
  }

  return {
    cssText: text.slice(start, end),
    range: [start, end]
  };
}

function isMarkupStyleElement(node: any, selectors: StyleElementSelector[]): boolean {
  if(node.type !== "SvelteStyleElement"){
    return false;
  }

  const name = typeof node.name?.name === "string" ? node.name.name : "style";

  return selectors.some(selector => getCachedRegex(selector.element).test(name));
}

function isStyleElementSelector(selector: StyleSelector): selector is StyleElementSelector {
  return "element" in selector && selector.element !== undefined;
}

function isStyleCalleeSelector(selector: StyleSelector): selector is StyleCalleeSelector {
  return !isStyleElementSelector(selector);
}

function parseCSS(cssText: string, context?: string): CssNode | undefined {
  try {
    return parse(cssText, { context, positions: true });
  } catch {
    return undefined;
  }
}

function walkNode(node: any, visit: (node: any) => void, seen = new Set<object>()): void {
  if(!node || typeof node !== "object" || seen.has(node)){
    return;
  }

  seen.add(node);

  if(typeof node.type === "string"){
    visit(node);
  }

  for(const key in node){
    if(key === "parent" || key === "loc" || key === "range" || key === "tokens" || key === "comments"){
      continue;
    }

    const value = (node as Record<string, unknown>)[key];

    if(Array.isArray(value)){
      for(const child of value){
        walkNode(child, visit, seen);
      }
    } else if(value && typeof value === "object"){
      walkNode(value, visit, seen);
    }
  }
}
