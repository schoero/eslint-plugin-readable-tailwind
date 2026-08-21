import {
  createGetConflictingClasses,
  getConflictingClasses
} from "better-tailwindcss:tailwindcss/conflicting-classes.js";
import { async } from "better-tailwindcss:utils/context.js";
import { lintClasses } from "better-tailwindcss:utils/lint.js";
import { createRule } from "better-tailwindcss:utils/rule.js";
import { splitClasses } from "better-tailwindcss:utils/utils.js";

import type { Literal } from "better-tailwindcss:types/ast.js";
import type { Context } from "better-tailwindcss:types/rule.js";


export const noConflictingClasses = createRule({
  autofix: true,
  category: "correctness",
  description: "Disallow classes that produce conflicting styles.",
  docs: "https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-conflicting-classes.md",
  name: "no-conflicting-classes",
  recommended: true,

  messages: {
    conflicting: "Conflicting class detected: \"{{ className }}\" and \"{{ conflictingClassString }}\" apply the same CSS properties: \"{{ conflictingPropertiesString }}\"."
  },

  initialize(ctx) {
    createGetConflictingClasses(ctx);
  },

  lintLiterals: (ctx, literals) => lintLiterals(ctx, literals)
});

function lintLiterals(ctx: Context<typeof noConflictingClasses>, literals: Literal[]) {

  const asyncCtx = async(ctx);

  for(const literal of literals){

    const classes = splitClasses(literal.content);

    const { conflictingClasses, warnings } = getConflictingClasses(asyncCtx, classes);

    if(Object.keys(conflictingClasses).length === 0){
      continue;
    }

    lintClasses(ctx, literal, className => {
      if(!conflictingClasses[className]){
        return;
      }

      const conflicts = Object.entries(conflictingClasses[className]);

      if(conflicts.length === 0){
        return;
      }

      const conflictingClassNames = conflicts.map(([conflictingClassName]) => conflictingClassName);
      const conflictingProperties = conflicts.reduce<string[]>((acc, [, properties]) => {
        for(const property of properties){
          if(!acc.includes(property.cssPropertyName)){
            acc.push(property.cssPropertyName);
          }
        }
        return acc;
      }, []);

      const conflictingClassString = conflictingClassNames.join(", ");
      const conflictingPropertiesString = conflictingProperties.map(conflictingProperty => `"${conflictingProperty}"`).join(", ");

      return {
        data: {
          className,
          conflictingClassString,
          conflictingPropertiesString
        },
        id: "conflicting",
        warnings
      } as const;

    });

  }
}
