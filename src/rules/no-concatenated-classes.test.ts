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

  it("should only report the edge classes that are actually concatenated", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="'static bg-' + color + ' text-white trailing'" />`,
          astro: `<img class={"static bg-" + color + " text-white trailing"} />`,
          jsx: `() => <img className={"static bg-" + color + " text-white trailing"} />`,
          svelte: `<img class={"static bg-" + color + " text-white trailing"} />`,
          vue: `<template><img :class="'static bg-' + color + ' text-white trailing'" /></template>`,

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
