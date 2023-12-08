const EOL = "\n";
const TABS_IN_SPACES = 4;  // TypeScript internally uses 4 spaces for a tab

export function createTemplateTag(templateStrings: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  const assembledTemplateString = assembleTemplateString(templateStrings, ...values);
  const contentWithoutSurroundingNewLines = removeSurroundingNewLines(assembledTemplateString);
  const minIndentation = findCommonIndentation(contentWithoutSurroundingNewLines);
  const contentWithoutCommonIndentation = removeCommonIndentation(contentWithoutSurroundingNewLines, minIndentation);
  return contentWithoutCommonIndentation;
}

export function css(htmlCode: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(htmlCode, ...values);
}

export function findCommonIndentation(content: string, eol: string = EOL) {

  const lines = content.split(eol).filter(line => line.match(/\S/) !== null);

  for(const line of lines){
    if(line.match(/^\S+/)){
      return 0;
    }
  }

  const spaces = lines.map(
    line =>
      line.match(/^[^\S\t\n\r]+\S/)
        ? line.match(/^[^\S\t\n\r]*/)?.[0].length ?? 0
        : undefined
  ).filter(space => space !== undefined);

  const tabs = lines.map(
    line =>
      line.match(/^\t+\S/)
        ? line.match(/^\t*/)?.[0].length ?? 0
        : undefined
  ).filter(tab => tab !== undefined);


  const tabsInSpaces = tabs.map(tab => tab! * TABS_IN_SPACES);
  const indentations = [...spaces, ...tabsInSpaces] as number[];

  if(indentations.length <= 0){
    return 0;
  }

  const minIndentation = Math.min(...indentations);

  return minIndentation - minIndentation % 2;

}

export function html(htmlCode: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(htmlCode, ...values);
}

export function js(javaScriptCode: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(javaScriptCode, ...values);
}

export function json(jsonContent: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(jsonContent, ...values);
}

export function md(htmlCode: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(htmlCode, ...values);
}

export function removeCommonIndentation(content: string, minIndentation: number, eol: string = EOL) {

  if(minIndentation <= 0){
    return content;
  }

  const lines = content.split(eol);

  return lines.map(line => {

    let spacesLeft = minIndentation;

    for(let i = 0; i < line.length; i++){
      if(line[i] === " "){
        spacesLeft--;
      } else if(line[i] === "\t"){
        spacesLeft -= TABS_IN_SPACES;
      } else {
        break;
      }
      if(spacesLeft <= 0){
        line = line.slice(i + 1);
        break;
      }
    }

    return line;

  }).join(eol);

}

export function removeSurroundingNewLines(content: string) {
  return content.replace(/^\n|\n[\t ]*$/g, "");
}

function assembleTemplateString(templateString: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return templateString.reduce((acc, str, i) => `${acc}${str}${values[i] ?? ""}`, "");
}

export function replaceTabsWithSpaces(content: string, tabSize: number = 4) {
  return content.replaceAll(/^\t/g, " ".repeat(tabSize));
}

export function ts(typeScriptCode: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(typeScriptCode, ...values);
}

export function tsx(typeScriptCode: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(typeScriptCode, ...values);
}

export function txt(text: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return createTemplateTag(text, ...values);
}
