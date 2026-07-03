import { createRule } from "better-tailwindcss:utils/rule.js";
import { isConcatenatedLiteral } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const noConcatenatedClasses = createRule({
  autofix: false,
  category: "correctness",
  description: "Disallow concatenated classes in Tailwind CSS class strings.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-concatenated-classes.md",
  name: "no-concatenated-classes",
  recommended: true,

  messages: {
    concatenated: "Concatenated classes may be purged by Tailwind CSS. Avoid dynamic class construction: https://tailwindcss.com/docs/detecting-classes-in-source-files"
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});


function lintLiterals(ctx: Context<typeof noConcatenatedClasses>, literals: Literal[]) {
  for(const literal of literals){
    if(!isConcatenatedLiteral(literal)){
      continue;
    }

    ctx.report({
      id: "concatenated",
      range: literal.range
    });
  }
}
