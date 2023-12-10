import { createTag, splitStringTransformer, stripIndent } from "proper-tags";


const customIndentStripTransformer = (count: number) => {
  return {
    onEndResult(endResult: string) {
      return endResult.replace(new RegExp(`^ {${count}}`, "gm"), "");
    }
  };
};

export function createTrimTag(count: number) {
  return createTag(customIndentStripTransformer(count));
}

export const tsx = createTag(stripIndent, splitStringTransformer("\n"));
