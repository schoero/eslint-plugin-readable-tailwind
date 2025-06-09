const EOL = "\n";
const TABS_IN_SPACES = 4;


export const ts = createTemplateTag(undefined, true);
export const css = createTemplateTag(undefined, true);
export const vue = createTemplateTag(undefined, true);
export const html = createTemplateTag(undefined, true);
export const svelte = createTemplateTag(undefined, true);
export const angular = createTemplateTag(undefined, true);
export const jsx = createTemplateTag(undefined, true);

export const dedent = createTemplateTag(4, false);

function createTemplateTag(indentation?: number, removeNewLines: boolean = false) {
  return (templateStrings: TemplateStringsArray, ...values: (boolean | number | string)[]) => {
    const assembledTemplateString = assembleTemplateString(templateStrings, ...values);

    const contentWithoutSurroundingNewLines = removeNewLines
      ? removeSurroundingNewLines(assembledTemplateString)
      : assembledTemplateString;

    const minIndentation = indentation ?? findCommonIndentation(contentWithoutSurroundingNewLines);

    return removeCommonIndentation(contentWithoutSurroundingNewLines, minIndentation);
  };
}

function findCommonIndentation(content: string, eol: string = EOL) {

  const lines = content.split(eol).filter(line => line.match(/\S/) !== null);

  for(const line of lines){
    if(line.match(/^\S+/)){
      return 0;
    }
  }

  const spaces = lines.map(
    line => line.match(/^[^\S\t\n\r]+\S/)
      ? line.match(/^[^\S\t\n\r]*/)?.[0].length ?? 0
      : undefined
  ).filter(space => space !== undefined);

  const tabs = lines.map(
    line => line.match(/^\t+\S/)
      ? line.match(/^\t*/)?.[0].length ?? 0
      : undefined
  ).filter(tab => tab !== undefined);


  const tabsInSpaces = tabs.map(tab => tab * TABS_IN_SPACES);
  const indentations = [...spaces, ...tabsInSpaces] as number[];

  if(indentations.length <= 0){
    return 0;
  }

  const minIndentation = Math.min(...indentations);

  return minIndentation - minIndentation % 2;

}

function removeCommonIndentation(content: string, minIndentation: number, eol: string = EOL) {

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

function removeSurroundingNewLines(content: string) {
  return content.replace(/^\n|\n[\t ]*$/g, "");
}

function assembleTemplateString(templateString: TemplateStringsArray, ...values: (boolean | number | string)[]) {
  return templateString.reduce((acc, str, i) => `${acc}${str}${values[i] ?? ""}`, "");
}
