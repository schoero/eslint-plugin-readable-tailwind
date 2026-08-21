import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { buildClass } from "better-tailwindcss:utils/class.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { replacePlaceholders, splitClasses } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const noDeprecatedClasses = createRule({
  autofix: true,
  category: "stylistic",
  description: "Disallow the use of deprecated Tailwind CSS classes.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-deprecated-classes.md",
  name: "no-deprecated-classes",
  recommended: true,

  messages: {
    irreplaceable: "Class \"{{ className }}\" is deprecated. Check the tailwindcss documentation for more information: https://tailwindcss.com/docs/upgrade-guide#removed-deprecated-utilities",
    replaceable: "Deprecated class detected. Replace \"{{ className }}\" with \"{{fix}}\"."
  },

  initialize: ctx => {
    createGetDissectedClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});

const deprecations = [
  [
    { major: 4, minor: 0 }, [
      [/^shadow$/, "shadow-sm"],
      [/^inset-shadow$/, "inset-shadow-sm"],
      [/^drop-shadow$/, "drop-shadow-sm"],
      [/^blur$/, "blur-sm"],
      [/^backdrop-blur$/, "backdrop-blur-sm"],
      [/^rounded$/, "rounded-sm"],

      [/^bg-opacity-(.*)$/],
      [/^text-opacity-(.*)$/],
      [/^border-opacity-(.*)$/],
      [/^divide-opacity-(.*)$/],
      [/^ring-opacity-(.*)$/],
      [/^placeholder-opacity-(.*)$/],

      [/^flex-shrink$/, "shrink"],
      [/^flex-shrink-(.*)$/, "shrink-$1"],
      [/^flex-grow$/, "grow"],
      [/^flex-grow-(.*)$/, "grow-$1"],

      [/^overflow-ellipsis$/, "text-ellipsis"],

      [/^decoration-slice$/, "box-decoration-slice"],
      [/^decoration-clone$/, "box-decoration-clone"]
    ]
  ], [
    { major: 4, minor: 1 }, [
      [/^bg-left-top$/, "bg-top-left"],
      [/^bg-left-bottom$/, "bg-bottom-left"],
      [/^bg-right-top$/, "bg-top-right"],
      [/^bg-right-bottom$/, "bg-bottom-right"],
      [/^object-left-top$/, "object-top-left"],
      [/^object-left-bottom$/, "object-bottom-left"],
      [/^object-right-top$/, "object-top-right"],
      [/^object-right-bottom$/, "object-bottom-right"]
    ]
  ]
] satisfies [{ major: number; minor: number; }, [before: RegExp, after?: string][]][];


function lintLiterals(ctx: Context<typeof noDeprecatedClasses>, literals: Literal[]) {

  const { major, minor } = ctx.version;

  const asyncCtx = async(ctx);

  for(const literal of literals){

    const classes = splitClasses(literal.content);

    const { dissectedClasses, warnings } = getDissectedClasses(asyncCtx, classes);

    lintClasses(ctx, literal, className => {
      const dissectedClass = dissectedClasses[className];

      if(!dissectedClass){
        return;
      }

      for(const [version, deprecation] of deprecations){
        if(major < version.major || major === version.major && minor < version.minor){
          continue;
        }

        for(const [pattern, replacement] of deprecation){
          const match = dissectedClass.base.match(pattern);

          if(!match){
            continue;
          }

          if(!replacement){
            return {
              data: {
                className
              },
              id: "irreplaceable",
              warnings
            } as const;
          }

          const fix = buildClass(ctx, { ...dissectedClass, base: replacePlaceholders(replacement, match) });

          return {
            data: {
              className,
              fix
            },
            fix,
            id: "replaceable",
            warnings
          } as const;

        }
      }
    });

  }
}
