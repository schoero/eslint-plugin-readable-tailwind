import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "readable-tailwind:options:default-options.js";
import {
  ATTRIBUTE_SCHEMA,
  CALLEE_SCHEMA,
  TAG_SCHEMA,
  VARIABLE_SCHEMA
} from "readable-tailwind:options:descriptions.js";
import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";
import { createRuleListener } from "readable-tailwind:utils:rule.js";
import { augmentMessageWithWarnings, display, getCommonOptions, splitClasses } from "readable-tailwind:utils:utils.js";

import type { Rule } from "eslint";

import type { BracesMeta, Literal, QuoteMeta, WhitespaceMeta } from "readable-tailwind:types:ast.js";
import type {
  AttributeOption,
  CalleeOption,
  ESLintRule,
  TagOption,
  VariableOption
} from "readable-tailwind:types:rule.js";
import type { Warning } from "readable-tailwind:utils:utils.js";


export type Options = [
  Partial<
    AttributeOption &
    CalleeOption &
    TagOption &
    VariableOption &
    {
      classesPerLine?: number;
      group?: "emptyLine" | "never" | "newLine";
      indent?: "tab" | number;
      lineBreakStyle?: "unix" | "windows";
      preferSingleLine?: boolean;
      printWidth?: number;
    }
  >
];

interface Meta extends QuoteMeta, BracesMeta, WhitespaceMeta {
  indentation?: string;
}

const defaultOptions = {
  attributes: DEFAULT_ATTRIBUTE_NAMES,
  callees: DEFAULT_CALLEE_NAMES,
  classesPerLine: 0,
  group: "newLine",
  indent: 2,
  lineBreakStyle: "unix",
  preferSingleLine: false,
  printWidth: 80,
  tags: DEFAULT_TAG_NAMES,
  variables: DEFAULT_VARIABLE_NAMES
} as const satisfies Options[0];

const DOCUMENTATION_URL = "https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/docs/rules/multiline.md";

export const tailwindMultiline: ESLintRule<Options> = {
  name: "multiline" as const,
  rule: {
    create: ctx => createRuleListener(ctx, getOptions(ctx), lintLiterals),
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce consistent line wrapping for tailwind classes.",
        recommended: true,
        url: DOCUMENTATION_URL
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            ...CALLEE_SCHEMA,
            ...ATTRIBUTE_SCHEMA,
            ...VARIABLE_SCHEMA,
            ...TAG_SCHEMA,
            classesPerLine: {
              default: defaultOptions.classesPerLine,
              description: "The maximum amount of classes per line. Lines are wrapped appropriately to stay within this limit . The value `0` disables line wrapping by `classesPerLine`.",
              type: "integer"
            },
            group: {
              default: defaultOptions.group,
              description: "Defines how different groups of classes should be separated. A group is a set of classes that share the same modifier/variant.",
              enum: ["emptyLine", "never", "newLine"],
              type: "string"
            },
            indent: {
              default: defaultOptions.indent,
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
              ]
            },
            lineBreakStyle: {
              default: defaultOptions.lineBreakStyle,
              description: "The line break style. The style `windows` will use `\\r\\n` as line breaks and `unix` will use `\\n`.",
              enum: ["unix", "windows"],
              type: "string"
            },
            preferSingleLine: {
              default: defaultOptions.preferSingleLine,
              description: "Prefer a single line for the classes. When set to `true`, the rule will keep all classes on a single line until the line exceeds the `printWidth` or `classesPerLine` limit.",
              type: "boolean"
            },
            printWidth: {
              default: defaultOptions.printWidth,
              description: "The maximum line length. Lines are wrapped appropriately to stay within this limit. The value `0` disables line wrapping by `printWidth`.",
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

  const options = getOptions(ctx);
  const { classesPerLine, group: groupSeparator, indent, lineBreakStyle, preferSingleLine, printWidth } = options;

  for(const literal of literals){

    if(!literal.supportsMultiline){
      continue;
    }

    const lineStartPosition = literal.indentation + getIndentation(ctx, indent);
    const literalStartPosition = literal.loc.start.column;

    const classChunks = splitClasses(literal.content);
    const groupedClasses = groupClasses(ctx, classChunks);

    const multilineClasses = new Lines(ctx, lineStartPosition);
    const singlelineClasses = new Lines(ctx, lineStartPosition);

    if(literal.openingQuote){
      if(literal.multilineQuotes?.includes("\\`")){
        multilineClasses.line.addMeta({ openingQuote: "\\`" });
      } else if(literal.multilineQuotes?.includes("`")){
        multilineClasses.line.addMeta({ openingQuote: "`" });
      } else {
        multilineClasses.line.addMeta({ openingQuote: literal.openingQuote });
      }
    }

    if(literal.openingQuote && literal.closingQuote){
      singlelineClasses.line.addMeta({ closingQuote: literal.closingQuote, openingQuote: literal.openingQuote });
    }

    leadingTemplateLiteralNewLine: if(literal.type === "TemplateLiteral" && literal.closingBraces){

      multilineClasses.line.addMeta({
        closingBraces: literal.closingBraces
      });

      // skip newline for sticky classes
      if(literal.leadingWhitespace === "" && groupedClasses){
        break leadingTemplateLiteralNewLine;
      }

      // skip if no classes are present
      if(!groupedClasses){
        break leadingTemplateLiteralNewLine;
      }

      if(groupSeparator === "emptyLine"){
        multilineClasses.addLine();
      }

      if(
        groupSeparator === "emptyLine" ||
        groupSeparator === "newLine" ||
        groupSeparator === "never"
      ){
        multilineClasses.addLine();
        multilineClasses.line.indent();
      }

    }

    if(groupedClasses){

      for(let g = 0; g < groupedClasses.length; g++){

        const group = groupedClasses.at(g)!;

        const isFirstGroup = g === 0;

        if(group.classCount === 0){
          continue;
        }

        if(isFirstGroup && (
          literal.type === "TemplateLiteral" && !literal.closingBraces ||
          literal.type !== "TemplateLiteral"
        )){
          multilineClasses.addLine();
          multilineClasses.line.indent();
        }

        if(!isFirstGroup){

          if(groupSeparator === "emptyLine"){
            multilineClasses.addLine();
          }

          if(
            groupSeparator === "emptyLine" || groupSeparator === "newLine"){
            multilineClasses.addLine();
            multilineClasses.line.indent();
          }

        }

        for(let i = 0; i < group.classCount; i++){

          const isFirstClass = i === 0;
          const isLastClass = i === group.classCount - 1;

          const className = group.at(i)!;

          const simulatedLine = multilineClasses.line
            .clone()
            .addClass(className)
            .toString();

          // wrap after the first sticky class
          if(isFirstClass && literal.leadingWhitespace === "" &&
            literal.type === "TemplateLiteral" && literal.closingBraces){

            multilineClasses.line.addClass(className);

            // don't add a new line if the first class is also the last
            if(isLastClass){
              break;
            }

            if(groupSeparator === "emptyLine"){
              multilineClasses.addLine();
            }

            if(groupSeparator === "emptyLine" || groupSeparator === "newLine"){
              multilineClasses.addLine();
              multilineClasses.line.indent();
            }

            continue;
          }

          // wrap before the last sticky class
          if(isLastClass && literal.trailingWhitespace === "" &&
            literal.type === "TemplateLiteral" && literal.openingBraces){

            // skip wrapping for the first class of a group
            if(isFirstClass){
              multilineClasses.line.addClass(className);
              continue;
            }

            if(groupSeparator === "emptyLine"){
              multilineClasses.addLine();
            }

            if(groupSeparator === "emptyLine" || groupSeparator === "newLine"){
              multilineClasses.addLine();
              multilineClasses.line.indent();
            }

            multilineClasses.line.addClass(className);

            continue;
          }

          // wrap if the length exceeds the limits
          if(
            simulatedLine.length > printWidth && printWidth !== 0 ||
            multilineClasses.line.classCount >= classesPerLine && classesPerLine !== 0
          ){

            // but only if it is not the first class of a group or classes are not grouped
            if(!isFirstClass || groupSeparator === "never"){
              multilineClasses.addLine();
              multilineClasses.line.indent();
            }
          }

          multilineClasses.line.addClass(className);
          singlelineClasses.line.addClass(className);

        }
      }
    }

    trailingTemplateLiteralNewLine: if(literal.type === "TemplateLiteral" && literal.openingBraces){

      // skip newline for sticky classes
      if(literal.trailingWhitespace === "" && groupedClasses){

        multilineClasses.line.addMeta({
          openingBraces: literal.openingBraces
        });

        break trailingTemplateLiteralNewLine;
      }

      if(groupSeparator === "emptyLine" && groupedClasses){
        multilineClasses.addLine();
      }

      if(
        groupSeparator === "emptyLine" ||
        groupSeparator === "newLine" ||
        groupSeparator === "never"
      ){
        multilineClasses.addLine();
        multilineClasses.line.indent();
      }

      multilineClasses.line.addMeta({
        openingBraces: literal.openingBraces
      });

    }

    if(literal.closingQuote){
      multilineClasses.addLine();
      multilineClasses.line.indent(lineStartPosition - getIndentation(ctx, indent));

      if(literal.multilineQuotes?.includes("\\`")){
        multilineClasses.line.addMeta({ closingQuote: "\\`" });
      } else if(literal.multilineQuotes?.includes("`")){
        multilineClasses.line.addMeta({ closingQuote: "`" });
      } else {
        multilineClasses.line.addMeta({ closingQuote: literal.closingQuote });
      }
    }

    // collapse lines if there is no reason for line wrapping or if preferSingleLine is enabled
    collapse:{

      // disallow collapsing if the literal contains variants, except preferSingleLine is enabled
      if(groupedClasses?.length !== 1 && !preferSingleLine){
        break collapse;
      }

      // disallow collapsing for template literals with braces (expressions)
      if(literal.type === "TemplateLiteral" && (literal.openingBraces || literal.closingBraces)){
        break collapse;
      }

      // disallow collapsing if the original literal was a single line (keeps original whitespace)
      if(!literal.content.includes(getLineBreaks(lineBreakStyle))){
        break collapse;
      }

      // disallow collapsing if the single line contains more classes than the classesPerLine
      if(singlelineClasses.line.classCount > classesPerLine && classesPerLine !== 0){
        break collapse;
      }

      // disallow collapsing if the single line including the element and all previous characters is longer than the printWidth
      if(literalStartPosition + singlelineClasses.line.length > printWidth && printWidth !== 0){
        break collapse;
      }

      // disallow collapsing if the literal contains expressions
      if(literal.type === "TemplateLiteral" && (literal.openingBraces || literal.closingBraces)){
        break collapse;
      }

      const fixedClasses = singlelineClasses.line.toString(false);

      if(literal.raw === fixedClasses){
        continue;
      }

      ctx.report({
        data: {
          notReadable: display(literal.raw),
          readable: display(fixedClasses)
        },
        fix(fixer) {
          return fixer.replaceTextRange(literal.range, fixedClasses);
        },
        loc: literal.loc,
        message: augmentMessage(literal.raw, options, "Unnecessary line wrapping. Expected\n\n{{ notReadable }}\n\nto be\n\n{{ readable }}")
      });

      return;

    }

    // skip if class string was empty
    if(multilineClasses.length === 2){
      if(!literal.openingBraces && !literal.closingBraces && literal.content.trim() === ""){
        continue;
      }
    }

    // skip line wrapping if preferSingleLine is enabled and the single line does not exceed the printWidth or classesPerLine
    if(
      preferSingleLine &&
      (
        literalStartPosition + singlelineClasses.line.length <= printWidth && printWidth !== 0 ||
        singlelineClasses.line.classCount <= classesPerLine && classesPerLine !== 0
      ) ||
      printWidth === 0 && classesPerLine === 0
    ){
      continue;
    }

    // skip line wrapping if it is not necessary
    skip:{

      // disallow skipping if class string contains multiple groups
      if(groupedClasses && groupedClasses.length > 1){
        break skip;
      }

      // disallow skipping if the original literal was longer than the printWidth
      if(
        literalStartPosition + singlelineClasses.line.length > printWidth && printWidth !== 0 ||
        singlelineClasses.line.classCount > classesPerLine && classesPerLine !== 0){
        break skip;
      }

      // disallow skipping for template literals with braces (expressions)
      if(literal.type === "TemplateLiteral" && (literal.openingBraces || literal.closingBraces)){
        break skip;
      }

      const openingQuoteLength = literal.openingQuote?.length ?? 0;
      const closingBracesLength = literal.closingBraces?.length ?? 0;

      const firstLineLength = multilineClasses
        .at(1)
        .toString()
        .trim()
        .length +
        openingQuoteLength +
        closingBracesLength;

      // disallow skipping if the first line including the element and all previous characters is longer than the printWidth
      if(literalStartPosition + firstLineLength > printWidth && printWidth !== 0){
        break skip;
      }

      // disallow skipping if the first line contains more classes than the classesPerLine
      if(multilineClasses.at(1).classCount > classesPerLine && classesPerLine !== 0){
        break skip;
      }

      continue;

    }

    const fixedClasses = multilineClasses.toString(lineBreakStyle);

    if(literal.raw === fixedClasses){
      continue;
    }

    ctx.report({
      data: {
        notReadable: display(literal.raw),
        readable: display(fixedClasses)
      },
      fix(fixer) {
        return literal.surroundingBraces
          ? fixer.replaceTextRange(literal.range, `{${fixedClasses}}`)
          : fixer.replaceTextRange(literal.range, fixedClasses);
      },
      loc: literal.loc,
      message: augmentMessage(literal.raw, options, "Incorrect line wrapping. Expected\n\n{{ notReadable }}\n\nto be\n\n{{ readable }}")
    });

  }

}

function getIndentation(ctx: Rule.RuleContext, indentation: Options[0]["indent"]): number {
  return indentation === "tab" ? 1 : indentation ?? 0;
}

function getOptions(ctx: Rule.RuleContext) {

  const options: Options[0] = ctx.options[0] ?? {};

  const common = getCommonOptions(ctx);

  const printWidth = options.printWidth ?? defaultOptions.printWidth;
  const classesPerLine = options.classesPerLine ?? defaultOptions.classesPerLine;
  const indent = options.indent ?? defaultOptions.indent;
  const group = options.group ?? defaultOptions.group;
  const preferSingleLine = options.preferSingleLine ?? defaultOptions.preferSingleLine;
  const lineBreakStyle = options.lineBreakStyle ?? defaultOptions.lineBreakStyle;

  return {
    ...common,
    classesPerLine,
    group,
    indent,
    lineBreakStyle,
    preferSingleLine,
    printWidth
  };

}


class Lines {

  private lines: Line[] = [];
  private currentLine: Line | undefined;
  private indentation = 0;
  private ctx: Rule.RuleContext;

  constructor(ctx: Rule.RuleContext, indentation: number) {
    this.ctx = ctx;
    this.indentation = indentation;

    this.addLine();
  }

  public at(index: number) {
    return index >= 0
      ? this.lines[index]
      : this.lines[this.lines.length + index];
  }

  public get line() {
    return this.currentLine!;
  }

  public get length() {
    return this.lines.length;
  }

  public addLine() {
    const line = new Line(this.ctx, this.indentation);
    this.lines.push(line);
    this.currentLine = line;
    return this;
  }

  public toString(lineBreakStyle: Options[0]["lineBreakStyle"] = "unix") {
    const lineBreaks = getLineBreaks(lineBreakStyle);

    return this.lines.map(
      line => line.toString()
    ).join(lineBreaks);
  }
}

class Line {

  private classes: string[] = [];
  private meta: Meta = {};
  private ctx: Rule.RuleContext;
  private indentation = 0;

  constructor(ctx: Rule.RuleContext, indentation: number) {
    this.ctx = ctx;
    this.indentation = indentation;
  }

  public indent(start: number = this.indentation) {
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

  public addMeta(meta: Meta) {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  public addClass(className: string) {
    this.classes.push(className);
    return this;
  }

  public clone() {
    const line = new Line(this.ctx, this.indentation);
    line.classes = [...this.classes];
    line.meta = { ...this.meta };
    return line;
  }

  public toString(indent: boolean = true) {
    return this.join([
      indent ? this.meta.indentation : "",
      this.meta.openingQuote,
      this.meta.closingBraces,
      this.meta.leadingWhitespace ?? "",
      escapeNestedQuotes(
        this.join(this.classes),
        this.meta.openingQuote ?? "`"
      ),
      this.meta.trailingWhitespace ?? "",
      this.meta.openingBraces,
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

function getLineBreaks(lineBreakStyle: Options[0]["lineBreakStyle"]) {
  return lineBreakStyle === "unix" ? "\n" : "\r\n";
}

function augmentMessage(original: string, options: ReturnType<typeof getOptions>, message: string) {
  const invalidLineBreaks = isLineBreakStyleLikelyMisconfigured(original, options);
  const invalidIndentations = isIndentationLikelyMisconfigured(original, options);

  const warnings: Warning<Options[0]>[] = [];

  if(invalidLineBreaks){
    warnings.push({
      option: "lineBreakStyle",
      title: "Inconsistent line endings detected",
      url: `${DOCUMENTATION_URL}#linebreakstyle`
    });
  }

  if(invalidIndentations){
    warnings.push({
      option: "indent",
      title: "Inconsistent indentation detected",
      url: `${DOCUMENTATION_URL}#indent`
    });
  }

  return augmentMessageWithWarnings(message, warnings);
}

function isLineBreakStyleLikelyMisconfigured(original: string, options: ReturnType<typeof getOptions>) {
  return (
    original.includes("\r") && options.lineBreakStyle === "unix" ||
    !original.includes("\r") && options.lineBreakStyle === "windows"
  );
}

function isIndentationLikelyMisconfigured(original: string, options: ReturnType<typeof getOptions>) {
  return (
    original.includes("  ") && options.indent === "tab" ||
    original.includes("\t") && typeof options.indent === "number"
  );
}
