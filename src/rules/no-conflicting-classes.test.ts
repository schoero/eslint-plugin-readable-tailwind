import { describe, it } from "vitest";

import { noConflictingClasses } from "better-tailwindcss:rules/no-conflicting-classes.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css } from "better-tailwindcss:tests/utils/template.js";
import { values } from "better-tailwindcss:tests/utils/values.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version";


describe.skipIf(getTailwindCSSVersion().major <= 3)(noConflictingClasses.name, () => {

  it("should not report on non-conflicting tailwind classes", () => {
    lint(
      noConflictingClasses,
      {
        valid: [
          {
            angular: `<img class="flex" />`,
            html: `<img class="flex" />`,
            jsx: `() => <img class="flex" />`,
            svelte: `<img class="flex" />`,
            vue: `<template><img class="flex" /></template>`
          }
        ]
      }
    );
  });

  it("should report on conflicting tailwind classes", () => {
    lint(
      noConflictingClasses,
      {
        invalid: [
          {
            angular: `<div class="flex block"></div>`,
            html: `<div class="flex block"></div>`,
            jsx: `() => <div class="flex block"></div>`,
            svelte: `<div class="flex block"></div>`,
            vue: `<template><div class="flex block"></div></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should quote each conflicting property only once in the message", () => {
    lint(
      noConflictingClasses,
      {
        invalid: [
          {
            html: `<div class="flex block"></div>`,
            jsx: `() => <div class="flex block"></div>`,

            errors: [
              { message: values(noConflictingClasses.messages!.conflicting, { className: "flex", conflictingClassString: "block", conflictingPropertiesString: `"display"` }) },
              { message: values(noConflictingClasses.messages!.conflicting, { className: "block", conflictingClassString: "flex", conflictingPropertiesString: `"display"` }) }
            ],
            files: {
              "styles.css": css`
                @import "tailwindcss";
              `
            },
            options: [{
              entryPoint: "styles.css"
            }]
          }
        ]
      }
    );
  });

  it("should not report on different variants", () => {
    lint(
      noConflictingClasses,
      {
        valid: [
          {
            angular: `<div class="flex hover:block"></div>`,
            html: `<div class="flex hover:block"></div>`,
            jsx: `() => <div class="flex hover:block"></div>`,
            svelte: `<div class="flex hover:block"></div>`,
            vue: `<template><div class="flex hover:block"></div></template>`
          }
        ]
      }
    );
  });

  it("should not report on the variants itself", () => {
    lint(
      noConflictingClasses,
      {
        valid: [
          {
            angular: `<div class="hover:flex hover:font-bold"></div>`,
            html: `<div class="hover:flex hover:font-bold"></div>`,
            jsx: `() => <div class="hover:flex hover:font-bold"></div>`,
            svelte: `<div class="hover:flex hover:font-bold"></div>`,
            vue: `<template><div class="hover:flex hover:font-bold"></div></template>`
          }
        ]
      }
    );
  });

  it("should report on the same variants", () => {
    lint(
      noConflictingClasses,
      {
        invalid: [
          {
            angular: `<div class="md:hover:flex md:hover:block"></div>`,
            html: `<div class="hover:flex hover:block"></div>`,
            jsx: `() => <div class="hover:flex hover:block"></div>`,
            svelte: `<div class="hover:flex hover:block"></div>`,
            vue: `<template><div class="hover:flex hover:block"></div></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should even report on classes if one of them has an important flag", () => {
    lint(
      noConflictingClasses,
      {
        invalid: [
          {
            angular: `<div class="flex block!"></div>`,
            html: `<div class="flex block!"></div>`,
            jsx: `() => <div class="flex block!"></div>`,
            svelte: `<div class="flex block!"></div>`,
            vue: `<template><div class="flex block!"></div></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should not report for css properties with an `undefined` value", () => {
    lint(
      noConflictingClasses,
      {
        valid: [
          {
            angular: `<div class="text-sm font-thin"></div>`,
            html: `<div class="text-sm font-thin"></div>`,
            jsx: `() => <div class="text-sm font-thin"></div>`,
            svelte: `<div class="text-sm font-thin"></div>`,
            vue: `<template><div class="text-sm font-thin"></div></template>`
          }
        ]
      }
    );
  });

  // #135
  it("should report errors when multiple properties apply the same styles", () => {
    lint(
      noConflictingClasses,
      {
        invalid: [
          {
            angular: `<div class="outline outline-1"></div>`,
            html: `<div class="outline outline-1"></div>`,
            jsx: `() => <div class="outline outline-1"></div>`,
            svelte: `<div class="outline outline-1"></div>`,
            vue: `<template><div class="outline outline-1"></div></template>`,

            errors: 2
          }
        ]
      }
    );
  });
});
