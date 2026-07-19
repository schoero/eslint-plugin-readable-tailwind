import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { isConcatenatedClass, isConcatenatedLiteral } from "better-tailwindcss:utils/utils.js";

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
    concatenated: "Concatenated classes may be purged by Tailwind CSS. Avoid dynamic class construction."
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});


function lintLiterals(ctx: Context<typeof noConcatenatedClasses>, literals: Literal[]) {
  for(const literal of literals){
    if(!isConcatenatedLiteral(literal)){
      continue;
    }

    lintClasses(ctx, literal, (_, index) => {
      if(!isConcatenatedClass(literal, index)){
        return;
      }

      return {
        id: "concatenated"
      } as const;
    });
  }
}
