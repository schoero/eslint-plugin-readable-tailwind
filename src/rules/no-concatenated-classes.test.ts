import { describe, it } from "vitest";

import { noConcatenatedClasses } from "better-tailwindcss:rules/no-concatenated-classes.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";


describe(noConcatenatedClasses.name, () => {

  it("should report classes concatenated with plus operator", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="'bg-' + color" />`,
          astro: `<img class={"bg-" + color} />`,
          jsx: `() => <img className={"bg-" + color} />`,
          svelte: `<img class={"bg-" + color} />`,
          vue: `<template><img :class="'bg-' + color" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report interpolated class strings", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${color}\`" />`,
          astro: `<img class={\`bg-\${color}\`} />`,
          jsx: `() => <img className={\`bg-\${color}\`} />`,
          svelte: `<img class={\`bg-\${color}\`} />`,
          vue: `<template><img :class="\`bg-\${color}\`" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should not report static class strings", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img class="bg-red-500 text-white" />`,
          astro: `<img class="bg-red-500 text-white" />`,
          html: `<img class="bg-red-500 text-white" />`,
          jsx: `() => <img className="bg-red-500 text-white" />`,
          svelte: `<img class="bg-red-500 text-white" />`,
          vue: `<template><img class="bg-red-500 text-white" /></template>`,

          css: `a { @apply bg-red-500 text-white; }`
        }
      ]
    });
  });
});
