import { describe, it } from "vitest";

import { enforceConsistentClassOrder } from "better-tailwindcss:rules/enforce-consistent-class-order.js";
import { enforceConsistentLineWrapping } from "better-tailwindcss:rules/enforce-consistent-line-wrapping.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { dedent } from "better-tailwindcss:tests/utils/template.js";
import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";


describe("vue", () => {

  it("should match attribute names via regex", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          vue: `<template><img customAttribute="b a" /></template>`,
          vueOutput: `<template><img customAttribute="a b" /></template>`,

          errors: 1,
          options: [{ attributes: [".*Attribute"], order: "asc" }]
        }
      ]
    });
  });

  it("should work in objects in bound classes", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          vue: `<template><img v-bind:class="{ 'c b a': condition === 'c b a' }" /></template>`,
          vueOutput: `<template><img v-bind:class="{ 'a b c': condition === 'c b a' }" /></template>`,

          errors: 1,
          options: [{ order: "asc" }]
        },
        {
          vue: `<template><img :class="{ 'c b a': condition === 'c b a' }" /></template>`,
          vueOutput: `<template><img :class="{ 'a b c': condition === 'c b a' }" /></template>`,

          errors: 1,
          options: [{ order: "asc" }]
        }
      ]
    });
  });

  it("should work in arrays in bound classes", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          vue: `<template><img v-bind:class="[condition === 'c b a' ? 'c b a' : 'f e d']" /></template>`,
          vueOutput: `<template><img v-bind:class="[condition === 'c b a' ? 'a b c' : 'd e f']" /></template>`,

          errors: 2,
          options: [{ order: "asc" }]
        },
        {
          vue: `<template><img :class="[condition === 'c b a' ? 'c b a' : 'f e d']" /></template>`,
          vueOutput: `<template><img :class="[condition === 'c b a' ? 'a b c' : 'd e f']" /></template>`,

          errors: 2,
          options: [{ order: "asc" }]
        }
      ]
    });
  });

  it("should evaluate bound classes", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          vue: `<template><img v-bind:class="defined('c b a')" /></template>`,
          vueOutput: `<template><img v-bind:class="defined('a b c')" /></template>`,

          errors: 1,
          options: [{ callees: ["defined"], order: "asc" }]
        },
        {
          vue: `<template><img :class="defined('c b a')" /></template>`,
          vueOutput: `<template><img :class="defined('a b c')" /></template>`,

          errors: 1,
          options: [{ callees: ["defined"], order: "asc" }]
        }
      ]
    });
  });

  it("should automatically prefix bound classes", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          vue: `<template><img v-bind:custom-class="['c b a']" /></template>`,
          vueOutput: `<template><img v-bind:custom-class="['a b c']" /></template>`,

          errors: 1,
          options: [{ attributes: [[":custom-class", [{ match: MatcherType.String }]]], order: "asc" }]
        },
        {
          vue: `<template><img :custom-class="['c b a']" /></template>`,
          vueOutput: `<template><img :custom-class="['a b c']" /></template>`,

          errors: 1,
          options: [{ attributes: [["v-bind:custom-class", [{ match: MatcherType.String }]]], order: "asc" }]
        }
      ]
    });
  });

  it("should match bound classes via regex", () => {
    lint(enforceConsistentClassOrder, {
      invalid: [
        {
          vue: `<template><img v-bind:testStyles="['c b a']" /></template>`,
          vueOutput: `<template><img v-bind:testStyles="['a b c']" /></template>`,

          errors: 1,
          options: [{ attributes: [[":.*Styles$", [{ match: MatcherType.String }]]], order: "asc" }]
        }
      ]
    });
  });

  // #95
  it("should change the quotes in expressions to backticks", () => {
    const singleLine = "a b c d e f";
    const multiLine = dedent`
      a b c
      d e f
    `;

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img :class="[true ? '${singleLine}' : '${singleLine}']" /></template>`,
          vueOutput: `<template><img :class="[true ? \`${multiLine}\` : \`${multiLine}\`]" /></template>`,

          errors: 2,
          options: [{ classesPerLine: 3 }]
        }
      ]
    });
  });

  it("should convert static classes to bound classes with template literals when vueConvertToBinding is enabled", () => {
    const singleLine = " a b c d e f g h ";
    const bound = "`\n  a b c\n  d e f\n  g h\n`";

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img class="${singleLine}" /></template>`,
          vueOutput: `<template><img :class="${bound}" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        },
        {
          vue: `<template><img class='${singleLine}' /></template>`,
          vueOutput: `<template><img :class='${bound}' /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ],
      valid: [
        {
          vue: `<template><img class="a b" /></template>`,

          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        },
        {
          vue: `<template><img :class="{ 'a b': condition }" /></template>`,

          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should not convert static classes when vueConvertToBinding is disabled", () => {
    const singleLine = " a b c d e f g h ";
    const multipleLines = dedent`
      a b c
      d e f
      g h
    `;

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img class="${singleLine}" /></template>`,
          vueOutput: `<template><img class="${multipleLines}" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2 }]
        }
      ]
    });
  });

  it("should not report an already converted binding", () => {
    const bound = "`\n  a b c\n  d e f\n  g h\n`";

    lint(enforceConsistentLineWrapping, {
      valid: [
        {
          vue: `<template><img :class="${bound}" /></template>`,

          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should wrap an existing template literal binding without adding a binding prefix", () => {
    const singleLineBound = "`a b c d e f g h`";
    const bound = "`\n  a b c\n  d e f\n  g h\n`";

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img :class="${singleLineBound}" /></template>`,
          vueOutput: `<template><img :class="${bound}" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should convert static classes to bound classes when wrapping is triggered by printWidth", () => {
    const singleLine = "absolute top-0 mr-0 mb-0 h-64 bg-secondary pt-0 pr-0 opacity-30 blur-sm invert flex items-center justify-center";
    const bound = "`\n  absolute top-0 mr-0 mb-0 h-64 bg-secondary pt-0 pr-0 opacity-30 blur-sm invert\n  flex items-center justify-center\n`";

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img class="${singleLine}" /></template>`,
          vueOutput: `<template><img :class="${bound}" /></template>`,

          errors: 1,
          options: [{ indent: 2, printWidth: 80, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should not affect sibling attributes when converting", () => {
    const singleLine = " a b c d e f g h ";
    const bound = "`\n  a b c\n  d e f\n  g h\n`";

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img class="${singleLine}" src="./image.svg" /></template>`,
          vueOutput: `<template><img :class="${bound}" src="./image.svg" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should not convert when the element already has a binding with the same name", () => {
    const singleLine = " a b c d e f g h ";
    const multipleLines = dedent`
      a b c
      d e f
      g h
    `;

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img class="${singleLine}" :class="{ active: condition }" /></template>`,
          vueOutput: `<template><img class="${multipleLines}" :class="{ active: condition }" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        },
        {
          vue: `<template><img class="${singleLine}" v-bind:class="{ active: condition }" /></template>`,
          vueOutput: `<template><img class="${multipleLines}" v-bind:class="{ active: condition }" /></template>`,

          errors: 1,
          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should convert custom matched attributes to their bound name", () => {
    const singleLine = " a b c d e f g h ";
    const bound = "`\n  a b c\n  d e f\n  g h\n`";

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img myClass="${singleLine}" /></template>`,
          vueOutput: `<template><img :myClass="${bound}" /></template>`,

          errors: 1,
          options: [{ attributes: ["myClass"], classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should convert static classes matched by matcher based selectors", () => {
    const singleLine = " a b c d e f g h ";
    const bound = "`\n  a b c\n  d e f\n  g h\n`";

    lint(enforceConsistentLineWrapping, {
      invalid: [
        {
          vue: `<template><img myClass="${singleLine}" /></template>`,
          vueOutput: `<template><img :myClass="${bound}" /></template>`,

          errors: 1,
          options: [{ attributes: [["myClass", [{ match: MatcherType.String }]]], classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  it("should not convert empty or whitespace only attributes", () => {
    lint(enforceConsistentLineWrapping, {
      valid: [
        {
          vue: `<template><img class="" /></template>`,

          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        },
        {
          vue: `<template><img class="   " /></template>`,

          options: [{ classesPerLine: 3, indent: 2, vueConvertToBinding: true }]
        }
      ]
    });
  });

  // #119
  it("should not report inside member expressions", () => {
    lint(noUnnecessaryWhitespace, {
      valid: [
        {
          vue: `<template><img :class="[ui[' ignored ']]" /></template>`
        }
      ]
    });
  });

  // #211
  it("should still handle object values even when they are immediately index accessed", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          vue: `<template><img :class="{ key: '  a b c  ' }['key']" /></template>`,
          vueOutput: `<template><img :class="{ key: 'a b c' }['key']" /></template>`,

          errors: 2,
          options: [{
            attributes: [[".*", [{ match: MatcherType.ObjectValue }]]]
          }]
        }
      ]
    });
  });

  // #226
  it("should not match index accessed object keys", () => {
    lint(noUnnecessaryWhitespace, {
      valid: [
        {
          vue: "<template><img class={{ '  a b c  ': '  d e f '}['  a b c  ']} /></template>",

          options: [{
            attributes: [["class", [{ match: MatcherType.ObjectKey }]]]
          }]
        }
      ]
    });
  });

  it("should match default export via variable selector", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          vue: `<script>export default " lint ";</script>`,
          vueOutput: `<script>export default "lint";</script>`,

          errors: 2,
          options: [{
            selectors: [
              {
                kind: SelectorKind.Variable,
                name: "^default$"
              }
            ]
          }]
        }
      ]
    });
  });

});
