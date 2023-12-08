import { createTag, splitStringTransformer, stripIndent } from "proper-tags";


export const tsx = createTag(stripIndent, splitStringTransformer("\n"));
