/* eslint-disable eslint-plugin-typescript/naming-convention */
import { describe, it } from "vitest";

import { tailwindNoDuplicateClasses } from "readable-tailwind:rules:tailwind-no-duplicate-classes.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("settings", () => {

  it("should use the global settings if provided", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img settings="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " />`,
          jsx: `() => <img settings="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " />`,
          settings: { "readable-tailwind": { attributes: ["settings"] } },
          svelte: `<img settings="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " />`,
          vue: `<template><img settings="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " /></template>`
        }
      ]
    });
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img settings="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " />`,
          jsx: `() => <img settings="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " />`,
          settings: { "eslint-plugin-readable-tailwind": { attributes: ["settings"] } },
          svelte: `<img settings="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " />`,
          vue: `<template><img settings="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " /></template>`
        }
      ]
    });
  });

  it("should always use rule options to override settings if provided", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img options="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " />`,
          jsx: `() => <img options="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " />`,
          options: [{ attributes: ["options"] }],
          settings: { "readable-tailwind": { attributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`
        }
      ]
    });
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img options="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " />`,
          jsx: `() => <img options="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " />`,
          options: [{ attributes: ["options"] }],
          settings: { "eslint-plugin-readable-tailwind": { attributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`
        }
      ]
    });
  });

  it("should only override provided settings on defaults", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          htmlOutput: `<img settings="  b  a  c    " class="  b  a  c  a  " />`,
          jsx: `() => <img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsxOutput: `() => <img settings="  b  a  c    " class="  b  a  c  a  " />`,
          settings: { "readable-tailwind": { attributes: ["settings"] } },
          svelte: `<img settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelteOutput: `<img settings="  b  a  c    " class="  b  a  c  a  " />`,
          vue: `<template><img settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img settings="  b  a  c    " class="  b  a  c  a  " /></template>`
        }
      ]
    });
  });

  it("should only override provided options on settings", () => {
    lint(tailwindNoDuplicateClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          html: `<img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          htmlOutput: `<img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsx: `() => <img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          jsxOutput: `() => <img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          options: [{ attributes: ["options"] }],
          settings: { "readable-tailwind": { attributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " />`,
          vue: `<template><img options="  b  a  c  a  " settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " settings="  b  a  c  a  " class="  b  a  c  a  " /></template>`
        }
      ]
    });
  });

});
