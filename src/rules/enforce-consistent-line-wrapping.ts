import {
  boolean,
  description,
  literal,
  minValue,
  number,
  optional,
  pipe,
  strictObject,
  union
} from "valibot";

import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { async } from "better-tailwindcss:utils/context.js";
import { escapeNestedQuotes } from "better-tailwindcss:utils/quotes.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { display, splitClasses } from "better-tailwindcss:utils/utils.js";

import type { DissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import type { BracesMeta, Literal, QuoteMeta, WhitespaceMeta } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


interface Meta extends QuoteMeta, BracesMeta, WhitespaceMeta {
  indentation?: string;
}


export const enforceConsistentLineWrapping = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce consistent line wrapping for tailwind classes.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-line-wrapping.md",
  name: "enforce-consistent-line-wrapping",
  recommended: true,

  messages: {
    missing: "Incorrect line wrapping. Expected\n\n{{ notReadable }}\n\nto be\n\n{{ readable }}",
    unnecessary: "Unnecessary line wrapping. Expected\n\n{{ notReadable }}\n\nto be\n\n{{ readable }}"
  },

  schema: strictObject({
    classesPerLine: optional(
      pipe(
        number(),
        minValue(0),
        description("The maximum amount of classes per line.")
      ),
      0
    ),
    group: optional(
      pipe(
        union([
          literal("newLine"),
          literal("emptyLine"),
          literal("never")
        ]),
        description("Defines how different groups of classes should be separated.")
      ),
      "newLine"
    ),
    indent: optional(
      pipe(
        union([
          literal("tab"),
          pipe(number(), minValue(0))
        ]),
        description("Determines how the code should be indented.")
      ),
      2
    ),
    lineBreakStyle: optional(
      pipe(
        union([literal("unix"),
          literal("windows")]),
        description("The line break style.")
      ),

      "unix"
    ),
    preferSingleLine: optional(
      pipe(
        boolean(),
        description("Prefer a single line for different variants.")
      ),

      false
    ),
    printWidth: optional(
      pipe(
        number(),
        minValue(0),
        description("The maximum line length before it gets wrapped.")
      ),
      80
    ),
    strictness: optional(
      pipe(
        union([
          literal("strict"),
          literal("loose")
        ]),
        description("Enable this option if prettier is used in your project.")
      ),
      "strict"
    ),
    tabWidth: optional(
      pipe(
        number(),
        minValue(1),
        description("The visual width of a tab character when evaluating printWidth.")
      ),
      1
    ),
    vueConvertToBinding: optional(
      pipe(
        boolean(),
        description("Convert static class attributes to bound attributes with template literals when wrapping lines. Currently only supported by the vue parser and useful to avoid conflicts with prettier.")
      ),
      false
    )
  }),

  initialize: ctx => {
    createGetDissectedClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});


function lintLiterals(ctx: Context<typeof enforceConsistentLineWrapping>, literals: Literal[]) {
  const { classesPerLine, group: groupSeparator, messageStyle, preferSingleLine, printWidth, strictness } = ctx.options;

  for(const literal of literals){

    if(!literal.supportsMultiline){
      continue;
    }

    const lineStartPosition = literal.indentation + getIndentation(ctx);
    const literalStartPosition = literal.loc.start.column;
    const prettierStartPosition = lineStartPosition + (literal.attribute ? literal.attribute.length + 1 : 0);

    const multilineClasses = new Lines(ctx, lineStartPosition);
    const singlelineClasses = new Lines(ctx, lineStartPosition);

    const classes = splitClasses(literal.content);

    const { dissectedClasses, warnings } = getDissectedClasses(async(ctx), classes);

    const invalidLineBreaks = isLineBreakStyleLikelyMisconfigured(ctx, literal.raw);
    const invalidIndentations = isIndentationLikelyMisconfigured(ctx, literal.raw);

    if(invalidLineBreaks){
      warnings.push({
        option: "lineBreakStyle",
        title: "Inconsistent line endings detected",
        url: `${ctx.docs}#linebreakstyle`
      });
    }

    if(invalidIndentations){
      warnings.push({
        option: "indent",
        title: "Inconsistent indentation detected",
        url: `${ctx.docs}#indent`
      });
    }

    const groupedClasses = groupClasses(classes, dissectedClasses);

    if(literal.openingQuote){
      if(literal.multilineQuotes?.includes("`")){
        multilineClasses.line.addMeta({ openingQuote: "`" });
      } else {
        multilineClasses.line.addMeta({ openingQuote: literal.openingQuote });
      }
    }

    if(literal.openingQuote && literal.closingQuote){
      singlelineClasses.line.addMeta({ closingQuote: literal.closingQuote, openingQuote: literal.openingQuote });
    }

    leadingTemplateLiteralNewLine: if(literal.isInterpolated && literal.closingBraces){

      multilineClasses.line.addMeta({ closingBraces: literal.closingBraces });

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
          literal.isInterpolated && !literal.closingBraces ||
          !literal.isInterpolated
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
            .addClass(className);

          // wrap after the first sticky class
          if(
            isFirstClass &&
            literal.leadingWhitespace === "" &&
            literal.isInterpolated &&
            literal.closingBraces
          ){

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
          if(
            isLastClass &&
            literal.trailingWhitespace === "" &&
            literal.isInterpolated &&
            literal.openingBraces
          ){

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

    trailingTemplateLiteralNewLine: if(literal.isInterpolated && literal.openingBraces){

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

    if(literal.closingQuote || literal.trailingSemicolon){
      multilineClasses.addLine();
      multilineClasses.line.indent(lineStartPosition - getIndentation(ctx));

      if(literal.multilineQuotes?.includes("`")){
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

      // disallow collapsing for interpolated literals
      if(literal.isInterpolated && (literal.openingBraces || literal.closingBraces)){
        break collapse;
      }

      // disallow collapsing if the original literal was a single line (keeps original whitespace)
      if(!literal.content.includes(getLineBreaks(ctx))){
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

      // add leading space for apply collapse
      if(literal.leadingApply && !literal.leadingApply.endsWith(" ")){
        singlelineClasses.line.addMeta({ leadingWhitespace: " " });
      }

      const fixedClasses = singlelineClasses.line.toString(false);

      if(literal.raw === fixedClasses){
        continue;
      }

      ctx.report({
        data: {
          notReadable: display(messageStyle, literal.raw),
          readable: display(messageStyle, fixedClasses)
        },
        fix: fixedClasses,
        id: "unnecessary",
        range: literal.range,
        warnings
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

    // force skip if prettier would wrap the attribute to a new line and then the single line would fit
    if(strictness === "loose" &&
      literalStartPosition + singlelineClasses.line.length > printWidth && printWidth !== 0 &&
      prettierStartPosition + singlelineClasses.line.length <= printWidth){
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

      // disallow skipping for interpolated literals
      if(literal.isInterpolated && (literal.openingBraces || literal.closingBraces)){
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

    const fixedClasses = multilineClasses.toString();

    if(literal.raw === fixedClasses){
      continue;
    }

    // convert a static attribute to a bound attribute with a template literal, or wrap in place
    const fix = literal.binding
      ? `${literal.binding.opening}${fixedClasses}${literal.binding.closing}`
      : literal.surroundingBraces
        ? `{${fixedClasses}}`
        : fixedClasses;

    ctx.report({
      data: {
        notReadable: display(messageStyle, literal.raw),
        readable: display(messageStyle, fix)
      },
      fix,
      id: "missing",
      range: literal.binding?.range ?? literal.range,
      warnings
    });

  }

}

function getIndentation(ctx: Context<typeof enforceConsistentLineWrapping>): number {
  const { indent } = ctx.options;
  return indent === "tab" ? 1 : indent ?? 0;
}


class Lines {

  private lines: Line[] = [];
  private currentLine: Line | undefined;
  private indentation = 0;
  private ctx: Context<typeof enforceConsistentLineWrapping>;

  constructor(ctx: Context<typeof enforceConsistentLineWrapping>, indentation: number) {
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

  public toString() {
    const lineBreaks = getLineBreaks(this.ctx);

    return this.lines.map(
      line => line.toString()
    ).join(lineBreaks);
  }
}

class Line {

  private classes: string[] = [];
  private meta: Meta = {};
  private ctx: Context<typeof enforceConsistentLineWrapping>;
  private indentation = 0;

  constructor(ctx: Context<typeof enforceConsistentLineWrapping>, indentation: number) {
    this.ctx = ctx;
    this.indentation = indentation;
  }

  public indent(start: number = this.indentation) {
    const { indent } = this.ctx.options;

    if(indent === "tab"){
      this.meta.indentation = "\t".repeat(start);
    } else {
      this.meta.indentation = " ".repeat(start);
    }

    return this;
  }

  public get length() {
    const line = this.toString();
    const { tabWidth } = this.ctx.options;

    if(tabWidth <= 1 || !line.includes("\t")){
      return line.length;
    }

    let width = 0;

    for(let i = 0; i < line.length; i++){
      width += line[i] === "\t"
        ? tabWidth
        : 1;
    }

    return width;
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
        this.meta.openingQuote ?? this.meta.closingQuote ?? "`"
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

function groupClasses(classes: string[], dissectedClasses: DissectedClasses) {

  if(classes.length === 0){
    return;
  }

  const groups = new Groups();

  for(const className of classes){

    const isFirstClass = classes.indexOf(className) === 0;
    const isFirstGroup = groups.length === 1;

    const lastGroup = groups.at(-1);
    const lastClassName = lastGroup?.at(-1);

    if(lastClassName){
      const lastDissectedClass = dissectedClasses[lastClassName];
      const currentDissectedClass = dissectedClasses[className];

      // parse variants manually for custom component classes
      const lastVariant = lastDissectedClass.variants?.join() ?? lastClassName.match(/^(.*):/)?.[1] ?? "";
      const variant = currentDissectedClass.variants?.join() ?? className.match(/^(.*):/)?.[1] ?? "";

      if(lastVariant !== variant && !(isFirstClass && isFirstGroup)){
        groups.addGroup();
      }
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

function getLineBreaks(ctx: Context<typeof enforceConsistentLineWrapping>) {
  const { lineBreakStyle } = ctx.options;
  return lineBreakStyle === "unix" ? "\n" : "\r\n";
}

function isLineBreakStyleLikelyMisconfigured(ctx: Context<typeof enforceConsistentLineWrapping>, original: string) {
  const { lineBreakStyle } = ctx.options;

  const hasWindowsLineBreaks = original.includes("\r\n");
  const hasUnixLineBreaks = /(^|[^\r])\n/.test(original);

  return (
    hasWindowsLineBreaks && lineBreakStyle === "unix" ||
    hasUnixLineBreaks && lineBreakStyle === "windows"
  );
}

function isIndentationLikelyMisconfigured(ctx: Context<typeof enforceConsistentLineWrapping>, original: string) {
  const { indent } = ctx.options;

  const hasSpaceIndentation = /\r?\n +/.test(original);
  const hasTabIndentation = /\r?\n\t+/.test(original);

  return (
    hasSpaceIndentation && indent === "tab" ||
    hasTabIndentation && typeof indent === "number"
  );
}
