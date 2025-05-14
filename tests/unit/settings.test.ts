/* eslint-disable eslint-plugin-typescript/naming-convention */
import { describe, it } from "vitest";

import { noDuplicateClasses } from "better-tailwindcss:rules:tailwind-no-duplicate-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe("settings", () => {

  it("should use the global settings if provided", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img settings="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " />`,
          jsx: `() => <img settings="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " />`,
          settings: { "better-tailwindcss": { attributes: ["settings"] } },
          svelte: `<img settings="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " />`,
          vue: `<template><img settings="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " /></template>`
        }
      ]
    });
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img settings="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " />`,
          jsx: `() => <img settings="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " />`,
          settings: { "eslint-plugin-better-tailwindcss": { attributes: ["settings"] } },
          svelte: `<img settings="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " />`,
          vue: `<template><img settings="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " /></template>`
        }
      ]
    });
  });

  it("should always use rule options to override settings if provided", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img options="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " />`,
          jsx: `() => <img options="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " />`,
          options: [{ attributes: ["options"] }],
          settings: { "better-tailwindcss": { attributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`
        }
      ]
    });
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img options="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " />`,
          jsx: `() => <img options="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " />`,
          options: [{ attributes: ["options"] }],
          settings: { "eslint-plugin-better-tailwindcss": { attributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`
        }
      ]
    });
  });

  it("should only override provided settings on defaults", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " class="  b  a  c  a  " />`,
          jsx: `() => <img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " class="  b  a  c  a  " />`,
          settings: { "better-tailwindcss": { attributes: ["settings"] } },
          svelte: `<img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " class="  b  a  c  a  " />`,
          vue: `<template><img settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " class="  b  a  c  a  " /></template>`
        }
      ]
    });
  });

  it("should only override provided options on settings", () => {
    lint(noDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsx: `() => <img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          options: [{ attributes: ["options"] }],
          settings: { "better-tailwindcss": { attributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          vue: `<template><img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`
        }
      ]
    });
  });

});
