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
          settings: { "readable-tailwind": { classAttributes: ["settings"] } },
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
          settings: { "eslint-plugin-readable-tailwind": { classAttributes: ["settings"] } },
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
          options: [{ classAttributes: ["options"] }],
          settings: { "readable-tailwind": { classAttributes: ["settings"] } },
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
          options: [{ classAttributes: ["options"] }],
          settings: { "eslint-plugin-readable-tailwind": { classAttributes: ["settings"] } },
          svelte: `<img options="  b  a  c  a  " />`,
          svelteOutput: `<img options="  b  a  c    " />`,
          vue: `<template><img options="  b  a  c  a  " /></template>`,
          vueOutput: `<template><img options="  b  a  c    " /></template>`
        }
      ]
    });
  });

});
