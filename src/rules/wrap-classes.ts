import type { Rule } from "eslint";
import type { JSXAttribute, JSXOpeningElement } from "estree-jsx";


export default {
  create(ctx) {

    return {

      JSXOpeningElement(node: JSXOpeningElement) {
        const classAttributes = getClassAttributes(ctx, node);

        classAttributes.forEach(classAttribute => {
          const value = getClassAttributeLiteral(ctx, classAttribute);

          if(value === undefined){
            return;
          }

          const classes = splitClasses(ctx, value);
          const sortedClasses = sortClasses(ctx, classes);

          const finalClassValue = sortedClasses.join(" ");

          if(value === finalClassValue){
            return;
          }

          /*
           * Report error to ESLint. Error message uses
           * a message placeholder to include the incorrect value
           * in the error message.
           * Also includes a `fix(fixer)` function that replaces
           * any values assigned to `const foo` with "bar".
           */
          ctx.report({
            data: {
              notSorted: value
            },
            fix(fixer) {
              return fixer.replaceText(classAttribute.value!, `"${finalClassValue}"`);
            },
            message: "Invalid class order: {{ notSorted }}.",
            node
          });

        });

        console.log(node);
      }

      // // Performs action in the function on every variable declarator
      // VariableDeclarator(node) {

      //   // Check if a `const` variable declaration
      //   if(node.parent.kind === "const"){

      //     // Check if variable name is `foo`
      //     if(node.id.type === "Identifier" && node.id.name === "foo"){

      //       // Check if value of variable is "bar"
      //       if(node.init && node.init.type === "Literal" && node.init.value !== "bar"){

      //         /*
      //                  * Report error to ESLint. Error message uses
      //                  * a message placeholder to include the incorrect value
      //                  * in the error message.
      //                  * Also includes a `fix(fixer)` function that replaces
      //                  * any values assigned to `const foo` with "bar".
      //                  */
      //         ctx.report({
      //           data: {
      //             notBar: node.init.value
      //           },
      //           fix(fixer) {
      //             return fixer.replaceText(node.init, '"bar"');
      //           },
      //           message: 'Value other than "bar" assigned to `const foo`. Unexpected value: {{ notBar }}.',
      //           node
      //         });
      //       }
      //     }
      //   }
      // }
    };
  },
  meta: {
    docs: {
      category: "Stylistic Issues",
      description: "Auto-wrap Tailwind CSS classes based on specified width and formatting rules",
      recommended: true
    },
    fixable: "code",
    type: "layout"
  }
} satisfies Rule.RuleModule;


function getClassAttributes(ctx: Rule.RuleContext, node: JSXOpeningElement): JSXAttribute[] {

  const { classAttributes } = unwrapOptions(ctx);

  return node.attributes.reduce<JSXAttribute[]>((acc, attr) => {
    if(attr.type === "JSXAttribute" && classAttributes.includes(attr.name.name)){
      acc.push(attr);
    }
    return acc;
  }, []);

}

function getClassAttributeLiteral(ctx: Rule.RuleContext, attribute: JSXAttribute): string | undefined {

  if(attribute.value === null){
    return;
  }

  if(attribute.value.type === "Literal" && typeof attribute.value.value === "string"){
    return attribute.value.value;
  }

  if(attribute.value.type === "JSXExpressionContainer" && attribute.value.expression.type === "Literal" && typeof attribute.value.expression.value === "string"){
    return attribute.value.expression.value;
  }

}

function splitClasses(ctx: Rule.RuleContext, classes: string): string[] {
  return classes
    .trim()
    .split(/\s+/);
}

function sortClasses(ctx: Rule.RuleContext, classes: string[]): string[] {
  // const classChunks = classes.map(className => unwrapClass(ctx, className));
  return classes.sort();
}


interface TailwindGroup {
  kind: "group";
  value: string;
  name?: string;
}

interface TailwindModifier {
  kind: "modifier";
  value: string;
}

interface TailwindClass {
  kind: "class";
  value: string;
}

type TailwindChunk = TailwindClass | TailwindGroup | TailwindModifier;

// function unwrapClass(ctx: Rule.RuleContext, className: string): TailwindChunk[] {

//   const classNameChunks = className.split(":");


//   return modifiers;

// }

function wrapClasses(ctx: Rule.RuleContext, classes: string): string[] {

  const options = ctx.options[0] ?? {};
  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? 5;
  const classAttributes = options.classAttributes ?? ["class", "className"];


}

function unwrapOptions(ctx: Rule.RuleContext) {

  const options = ctx.options[0] ?? {};
  const printWidth = options.printWidth ?? 80;
  const classesPerLine = options.classesPerLine ?? 5;
  const classAttributes = options.classAttributes ?? ["class", "className"];
  const sortByModifiers = options.sortByModifiers ?? true;
  const sortByPseudoElements = options.sortByPseudoElements ?? true;

  return {
    classAttributes,
    classesPerLine,
    printWidth
  };

}
