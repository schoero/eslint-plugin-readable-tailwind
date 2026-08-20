import { description, literal, optional, pipe, strictObject, union } from "valibot";

import { createGetDissectedClasses, getDissectedClasses } from "better-tailwindcss:tailwindcss/dissect-classes.js";
import { buildClass } from "better-tailwindcss:utils/class.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { splitClasses } from "better-tailwindcss:utils/utils.js";


export const enforceConsistentImportantPosition = createRule({
  autofix: true,
  category: "stylistic",
  description: "Enforce consistent important position for classes.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-important-position.md",
  name: "enforce-consistent-important-position",
  recommended: false,

  messages: {
    position: "Incorrect important position. '{{ className }}' should be '{{ fix }}'."
  },

  schema: strictObject({
    position: optional(
      pipe(
        union([
          literal("legacy"),
          literal("recommended")
        ]),
        description("Preferred position for important classes. 'legacy' places the important modifier (!) at the start of the class name, 'recommended' places it at the end.")
      )
    )
  }),

  initialize: ctx => {
    createGetDissectedClasses(ctx);
  },

  lintLiterals(ctx, literals) {

    const { position: configuredPosition } = ctx.options;

    const position = configuredPosition ?? (
      ctx.version.major >= 4
        ? "recommended"
        : "legacy"
    );

    const asyncCtx = async(ctx);

    for(const literal of literals){

      const classes = splitClasses(literal.content);

      const { dissectedClasses, warnings } = getDissectedClasses(asyncCtx, classes);

      lintClasses(ctx, literal, (className, index, after) => {
        const dissectedClass = dissectedClasses[className];

        if(!dissectedClass){
          return;
        }

        const [importantAtStart, importantAtEnd] = dissectedClass.important;

        if(
          !importantAtStart && !importantAtEnd ||
          position === "legacy" && importantAtStart ||
          position === "recommended" && importantAtEnd
        ){
          return;
        }

        if(ctx.version.major <= 3 && position === "recommended"){
          warnings.push({
            option: "position",
            title: `The "${position}" position is not supported in Tailwind CSS v3`,
            url: `${ctx.docs}#position`
          });
        }

        const fix = position === "recommended"
          ? buildClass(ctx, { ...dissectedClass, important: [false, true] })
          : buildClass(ctx, { ...dissectedClass, important: [true, false] });

        return {
          data: { className, fix },
          fix,
          id: "position",
          warnings
        } as const;
      });

    }
  }
});
