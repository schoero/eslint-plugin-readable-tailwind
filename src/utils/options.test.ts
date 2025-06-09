import { describe, it } from "vitest";

import { noDuplicateClasses } from "better-tailwindcss:rules/no-duplicate-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";


describe("settings", () => {

  it("should use the global settings if provided", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img settings="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " />`,
          jsx: `() => <img settings="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " />`,
          svelte: `<img settings="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " />`,
          vue: `<template><img settings="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " /></template>`,

          errors: 1,
          settings: { "better-tailwindcss": { attributes: ["settings"] } }
        }
      ]
    });
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img settings="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " />`,
          jsx: `() => <img settings="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " />`,
          svelte: `<img settings="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " />`,
          vue: `<template><img settings="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " /></template>`,

          errors: 1,
          settings: { "eslint-plugin-better-tailwindcss": { attributes: ["settings"] } }
        }
      ]
    });
  });

  it("should always use rule options to override settings if provided", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img options="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " />`,
          jsx: `() => <img options="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " />`,
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`,

          errors: 1,
          options: [{ attributes: ["options"] }],
          settings: { "better-tailwindcss": { attributes: ["settings"] } }
        }
      ]
    });
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img options="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " />`,
          jsx: `() => <img options="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " />`,
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`,

          errors: 1,
          options: [{ attributes: ["options"] }],
          settings: { "eslint-plugin-better-tailwindcss": { attributes: ["settings"] } }
        }
      ]
    });
  });

  it("should only override provided settings on defaults", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " class="  b  a  c  a  " />`,
          jsx: `() => <img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " class="  b  a  c  a  " />`,
          svelte: `<img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " class="  b  a  c  a  " />`,
          vue: `<template><img settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " class="  b  a  c  a  " /></template>`,

          errors: 1,
          settings: { "better-tailwindcss": { attributes: ["settings"] } }
        }
      ]
    });
  });

  it("should only override provided options on settings", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          html: `<img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsx: `() => <img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelte: `<img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          vue: `<template><img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,

          errors: 1,
          options: [{ attributes: ["options"] }],
          settings: { "better-tailwindcss": { attributes: ["settings"] } }
        }
      ]
    });
  });

});
