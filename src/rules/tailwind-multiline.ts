import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "readable-tailwind:utils:config.js";
import { getHTMLAttributes, getHTMLClassAttributeLiterals } from "readable-tailwind:utils:html.js";
import {
  getJSXAttributes,
  getJSXClassAttributeLiterals,
  getLiteralsByJSXCallExpression
} from "readable-tailwind:utils:jsx.js";
import { getSvelteAttributes, getSvelteClassAttributeLiterals } from "readable-tailwind:utils:svelte.js";
import { findLineStartPosition } from "readable-tailwind:utils:utils";
import { splitClasses } from "readable-tailwind:utils:utils.js";

import type { TagNode } from "es-html-parser";
import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { Literal, Meta } from "src/types/ast.js";
import type { ESLintRule } from "src/types/rule.js";
import type { SvelteStartTag } from "svelte-eslint-parser/lib/ast/index.js";


export type Options = [
  {
    callees?: string[];
    classAttributes?: string[];
    classesPerLine?: number;
    group?: "emptyLine" | "never" | "newLine";
    indent?: number | "tab";
    printWidth?: number;
    trim?: boolean;
  }
];

export const tailwindMultiline: ESLintRule<Options> = {
  name: "multiline" as const,
  rule: {
    create(ctx) {

      const { callees, classAttributes } = getOptions(ctx);

      return {

        CallExpression(node) {

          const { callee } = node;

          if(callee.type !== "Identifier"){ return; }
          if(!callees.includes(callee.name)){ return; }

          const literals = getLiteralsByJSXCallExpression(ctx, node.arguments);

          lintLiterals(ctx, literals);

        },

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const jsxAttributes = getJSXAttributes(ctx, classAttributes, jsxNode);

          for(const jsxAttribute of jsxAttributes){

            const attributeValue = jsxAttribute.value;
            const attributeName = jsxAttribute.name.name;

            if(!attributeValue){ continue; }
            if(typeof attributeName !== "string"){ continue; }

            const literals = getJSXClassAttributeLiterals(ctx, jsxAttribute);

            lintLiterals(ctx, literals);

          }

        },

        SvelteStartTag(node: Node) {

          const svelteNode = node as unknown as SvelteStartTag;

          const svelteAttributes = getSvelteAttributes(ctx, classAttributes, svelteNode);

          for(const svelteAttribute of svelteAttributes){

            const attributeName = svelteAttribute.key.name;

            if(typeof attributeName !== "string"){ continue; }

            const literals = getSvelteClassAttributeLiterals(ctx, svelteAttribute);

            lintLiterals(ctx, literals);

          }

        },

        Tag(node: Node) {

          const htmlTagNode = node as unknown as TagNode;
          const htmlAttributes = getHTMLAttributes(ctx, classAttributes, htmlTagNode);

          for(const htmlAttribute of htmlAttributes){
            const literals = getHTMLClassAttributeLiterals(ctx, htmlAttribute);

            lintLiterals(ctx, literals);
          }

        }

      };
    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce consistent line wrapping for tailwind classes.",
        recommended: true,
        url: "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/multiline.md"
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            callees: {
              default: getOptions().callees,
              description: "List of function names whose arguments should also be considered.",
              items: {
                type: "string"
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
            },
            classesPerLine: {
              default: getOptions().classesPerLine,
              description: "The maximum number of classes per line.",
              type: "integer"
            },
            group: {
              default: getOptions().group,
              description: "The group separator.",
              enum: ["emptyLine", "never", "newLine"],
              type: "string"
            },
            indent: {
              default: getOptions().indent,
              description: "Determines how the code should be indented.",
              oneOf: [
                {
                  enum: ["tab"],
                  type: "string"
                },
                {
                  minimum: 0,
                  type: "integer"
                }
              ],
              type: "integer"

            },
            printWidth: {
              default: getOptions().printWidth,
              description: "The maximum line length. Lines are wrapped appropriately to stay within this limit or within the limit provided by the classesPerLine option.",
              type: "integer"
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

  const { classesPerLine, group: groupSeparator, indent, printWidth } = getOptions(ctx);

  for(const literal of literals){

    const startPosition = literal.type === "TemplateLiteral"
      ? findLineStartPosition(ctx, literal.parent) + getIndentation(ctx, indent)
      : findLineStartPosition(ctx, literal) + getIndentation(ctx, indent);

    const classChunks = splitClasses(literal.content);
    const groupedClasses = groupClasses(ctx, classChunks);

    const lines = new Lines(ctx, startPosition);

    if(literal.openingQuote){
      if(literal.parent.type === "JSXAttribute" || literal.parent.type === "JSXExpressionContainer" || literal.parent.type === "SvelteMustacheTag"){
        lines.line.addMeta({ openingQuote: "`" });
      } else {
        lines.line.addMeta({ openingQuote: literal.openingQuote });
      }
    }

    if(literal.type === "TemplateLiteral" && literal.closingBraces){
      lines.line.addMeta({ closingBraces: literal.closingBraces });
    }

    if(groupedClasses){

      for(const group of groupedClasses.groups){

        const isFirstGroup = groupedClasses.groups.indexOf(group) === 0;

        if(group.classCount === 0){
          continue;
        }

        if((
          literal.type === "TemplateLiteral" && !literal.closingBraces ||
          literal.type !== "TemplateLiteral"
        ) && isFirstGroup){
          lines.addLine();
          lines.line.indent();
        }

        if(isFirstGroup && literal.type === "TemplateLiteral" && literal.closingBraces || !isFirstGroup){

          if(groupSeparator === "emptyLine"){
            lines.addLine();
          }

          if(groupSeparator === "emptyLine" || groupSeparator === "newLine"){
            lines.addLine();
            lines.line.indent();
          }

        }

        for(const className of group.classes){

          const simulatedLine = lines.line
            .clone()
            .addClass(className)
            .toString();

          if(simulatedLine.length > printWidth || lines.line.classCount >= classesPerLine){
            lines.addLine();
            lines.line.indent();
          }

          lines.line.addClass(className);

        }
      }
    }

    if(literal.type === "TemplateLiteral" && literal.openingBraces){

      if(groupSeparator === "emptyLine" && groupedClasses){ lines.addLine(); }

      lines.addLine();
      lines.line.indent();
      lines.line.addMeta({ openingBraces: literal.openingBraces });

    }

    if(literal.closingQuote){
      lines.addLine();
      lines.line.indent(startPosition - getIndentation(ctx, indent));

      if(literal.parent.type === "JSXAttribute" || literal.parent.type === "JSXExpressionContainer" || literal.parent.type === "SvelteMustacheTag"){
        lines.line.addMeta({ closingQuote: "`" });
      } else {
        lines.line.addMeta({ closingQuote: literal.closingQuote });
      }
    }

    if(lines.length === 3 && (
      literal.type === "TemplateLiteral" && !literal.openingBraces && !literal.closingBraces ||
      literal.type === "StringLiteral"
    )){
      continue;
    }

    const fixedClasses = lines.toString();

    if(literal.raw === fixedClasses){
      continue;
    }

    ctx.report({
      data: {
        notReadable: literal.content
      },
      fix(fixer) {
        return literal.parent.type === "JSXAttribute"
          ? fixer.replaceTextRange(literal.range, `{${fixedClasses}}`)
          : fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: "Invalid line wrapping: \"{{ notReadable }}\"."
    });

  }

}

function getIndentation(ctx: Rule.RuleContext, indentation: Options[0]["indent"]): number {
  return indentation === "tab" ? 1 : indentation ?? 0;
}

function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? 100_000;
  const indent = options.indent ?? 2;
  const group = options.group ?? "emptyLine";

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;

  return {
    callees,
    classAttributes,
    classesPerLine,
    group,
    indent,
    printWidth
  };

}


class Lines {

  private lines: Line[] = [];
  private currentLine: Line | undefined;
  private startPosition = 0;
  private ctx: Rule.RuleContext;

  constructor(ctx: Rule.RuleContext, startPosition: number) {
    this.ctx = ctx;
    this.startPosition = startPosition;

    this.addLine();
  }

  public get line() {
    return this.currentLine!;
  }

  public get length() {
    return this.lines.length;
  }

  public addLine() {
    const line = new Line(this.ctx, this.startPosition);
    this.lines.push(line);
    this.currentLine = line;
    return this;
  }

  public toString() {
    return this.lines.map(
      line => line.toString()
    ).join("\n");
  }

}

class Line {

  private classes: string[] = [];
  private meta: Meta = {};
  private ctx: Rule.RuleContext;
  private startPosition = 0;

  constructor(ctx: Rule.RuleContext, startPosition: number) {
    this.ctx = ctx;
    this.startPosition = startPosition;
  }

  public indent(start: number = this.startPosition) {
    const indent = getOptions(this.ctx).indent;

    if(indent === "tab"){
      this.meta.indentation = "\t".repeat(start);
    } else {
      this.meta.indentation = " ".repeat(start);
    }

    return this;
  }

  public get length() {
    return this.toString().length;
  }

  public get classCount() {
    return this.classes.length;
  }

  public get printWidth() {
    return this.toString().length;
  }

  public addMeta({ closingBraces, closingQuote, openingBraces, openingQuote }: Meta) {
    this.meta = { ...this.meta, closingBraces, closingQuote, openingBraces, openingQuote };
    return this;
  }

  public addClass(className: string) {
    this.classes.push(className);
    return this;
  }

  public clone() {
    const line = new Line(this.ctx, this.startPosition);
    line.classes = [...this.classes];
    line.meta = { ...this.meta };
    return line;
  }

  public toString() {
    return this.join([
      this.meta.indentation,
      this.meta.openingQuote,
      this.join([
        this.meta.closingBraces,
        ...this.classes,
        this.meta.openingBraces
      ]),
      this.meta.closingQuote
    ], "");
  }

  private join(content: (string | undefined)[], separator: string = " ") {
    return content
      .filter(content => content !== undefined)
      .join(separator);
  }
}

function groupClasses(ctx: Rule.RuleContext, classes: string[]) {

  if(classes.length === 0){
    return;
  }

  const groups = new Groups();

  for(const className of classes){

    const isFirstClass = classes.indexOf(className) === 0;
    const isFirstGroup = groups.length === 1;

    const lastGroup = groups.at(-1);
    const lastClass = lastGroup?.at(-1);
    const lastModifier = lastClass?.match(/^.*?:/)?.[0];
    const modifier = className.match(/^.*?:/)?.[0];

    if(lastModifier !== modifier && !(isFirstClass && isFirstGroup)){
      groups.addGroup();
    }

    groups.group.addClass(className);

  }

  return groups;

}

class Groups {

  public readonly groups: Group[] = [];
  private currentGroup: Group | undefined;

  constructor() {
    this.addGroup();
  }

  public get group() {
    return this.currentGroup!;
  }

  public at(index: number) {
    return this.groups.at(index);
  }

  public get length() {
    return this.groups.length;
  }

  public addGroup() {
    const group = new Group();
    this.currentGroup = group;
    this.groups.push(this.currentGroup);
    return this;
  }
}

class Group {

  public readonly classes: string[] = [];

  public get classCount() {
    return this.classes.length;
  }

  public at(index: number) {
    return this.classes.at(index);
  }

  public addClass(className: string) {
    this.classes.push(className);
    return this;
  }
}
