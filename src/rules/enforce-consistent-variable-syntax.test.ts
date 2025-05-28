import { describe, it } from "vitest";

import { enforceConsistentVariableSyntax } from "better-tailwindcss:rules:enforce-consistent-variable-syntax.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";


describe(enforceConsistentVariableSyntax.name, () => {

  it("should not report on the preferred syntax", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        valid: [
          {
            angular: `<img class="bg-(--brand)" />`,
            html: `<img class="bg-(--brand)" />`,
            jsx: `() => <img class="bg-(--brand)" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="bg-(--brand)" />`,
            vue: `<template><img class="bg-(--brand)" /></template>`
          },
          {
            angular: `<img class="bg-[var(--brand)]" />`,
            html: `<img class="bg-[var(--brand)]" />`,
            jsx: `() => <img class="bg-[var(--brand)]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="bg-[var(--brand)]" />`,
            vue: `<template><img class="bg-[var(--brand)]" /></template>`
          }
        ]
      }
    );
  });

  it("should report on the wrong syntax", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="bg-(--brand)" />`,
            angularOutput: `<img class="bg-[var(--brand)]" />`,
            errors: 1,
            html: `<img class="bg-(--brand)" />`,
            htmlOutput: `<img class="bg-[var(--brand)]" />`,
            jsx: `() => <img class="bg-(--brand)" />`,
            jsxOutput: `() => <img class="bg-[var(--brand)]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="bg-(--brand)" />`,
            svelteOutput: `<img class="bg-[var(--brand)]" />`,
            vue: `<template><img class="bg-(--brand)" /></template>`,
            vueOutput: `<template><img class="bg-[var(--brand)]" /></template>`
          },
          {
            angular: `<img class="bg-[var(--brand)]" />`,
            angularOutput: `<img class="bg-(--brand)" />`,
            errors: 1,
            html: `<img class="bg-[var(--brand)]" />`,
            htmlOutput: `<img class="bg-(--brand)" />`,
            jsx: `() => <img class="bg-[var(--brand)]" />`,
            jsxOutput: `() => <img class="bg-(--brand)" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="bg-[var(--brand)]" />`,
            svelteOutput: `<img class="bg-(--brand)" />`,
            vue: `<template><img class="bg-[var(--brand)]" /></template>`,
            vueOutput: `<template><img class="bg-(--brand)" /></template>`
          }
        ]
      }
    );
  });

  it("should preserve fallback values", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="bg-[var(--brand,_#000)]" />`,
            angularOutput: `<img class="bg-(--brand,_#000)" />`,
            errors: 1,
            html: `<img class="bg-[var(--brand,_#000)]" />`,
            htmlOutput: `<img class="bg-(--brand,_#000)" />`,
            jsx: `() => <img class="bg-[var(--brand,_#000)]" />`,
            jsxOutput: `() => <img class="bg-(--brand,_#000)" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="bg-[var(--brand,_#000)]" />`,
            svelteOutput: `<img class="bg-(--brand,_#000)" />`,
            vue: `<template><img class="bg-[var(--brand,_#000)]" /></template>`,
            vueOutput: `<template><img class="bg-(--brand,_#000)" /></template>`
          },
          {
            angular: `<img class="bg-(--brand,_#000)" />`,
            angularOutput: `<img class="bg-[var(--brand,_#000)]" />`,
            errors: 1,
            html: `<img class="bg-(--brand,_#000)" />`,
            htmlOutput: `<img class="bg-[var(--brand,_#000)]" />`,
            jsx: `() => <img class="bg-(--brand,_#000)" />`,
            jsxOutput: `() => <img class="bg-[var(--brand,_#000)]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="bg-(--brand,_#000)" />`,
            svelteOutput: `<img class="bg-[var(--brand,_#000)]" />`,
            vue: `<template><img class="bg-(--brand,_#000)" /></template>`,
            vueOutput: `<template><img class="bg-[var(--brand,_#000)]" /></template>`
          }
        ]
      }
    );
  });

  it("should preserve css functions", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            angularOutput: `<img class="height-(--header,calc(100%_-_1rem))" />`,
            errors: 1,
            html: `<img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            htmlOutput: `<img class="height-(--header,calc(100%_-_1rem))" />`,
            jsx: `() => <img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            jsxOutput: `() => <img class="height-(--header,calc(100%_-_1rem))" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            svelteOutput: `<img class="height-(--header,calc(100%_-_1rem))" />`,
            vue: `<template><img class="height-[var(--header,calc(100%_-_1rem))]" /></template>`,
            vueOutput: `<template><img class="height-(--header,calc(100%_-_1rem))" /></template>`
          },
          {
            angular: `<img class="height-(--header,calc(100%_-_1rem))" />`,
            angularOutput: `<img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            errors: 1,
            html: `<img class="height-(--header,calc(100%_-_1rem))" />`,
            htmlOutput: `<img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            jsx: `() => <img class="height-(--header,calc(100%_-_1rem))" />`,
            jsxOutput: `() => <img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="height-(--header,calc(100%_-_1rem))" />`,
            svelteOutput: `<img class="height-[var(--header,calc(100%_-_1rem))]" />`,
            vue: `<template><img class="height-(--header,calc(100%_-_1rem))" /></template>`,
            vueOutput: `<template><img class="height-[var(--header,calc(100%_-_1rem))]" /></template>`
          }
        ]
      }
    );
  });

  it("should work with nested variables", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="bg-[var(--brand,var(--secondary))]" />`,
            angularOutput: `<img class="bg-(--brand,var(--secondary))" />`,
            errors: 1,
            html: `<img class="bg-[var(--brand,var(--secondary))]" />`,
            htmlOutput: `<img class="bg-(--brand,var(--secondary))" />`,
            jsx: `() => <img class="bg-[var(--brand,var(--secondary))]" />`,
            jsxOutput: `() => <img class="bg-(--brand,var(--secondary))" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="bg-[var(--brand,var(--secondary))]" />`,
            svelteOutput: `<img class="bg-(--brand,var(--secondary))" />`,
            vue: `<template><img class="bg-[var(--brand,var(--secondary))]" /></template>`,
            vueOutput: `<template><img class="bg-(--brand,var(--secondary))" /></template>`
          },
          {
            angular: `<img class="bg-(--brand,var(--secondary))" />`,
            angularOutput: `<img class="bg-[var(--brand,var(--secondary))]" />`,
            errors: 1,
            html: `<img class="bg-(--brand,var(--secondary))" />`,
            htmlOutput: `<img class="bg-[var(--brand,var(--secondary))]" />`,
            jsx: `() => <img class="bg-(--brand,var(--secondary))" />`,
            jsxOutput: `() => <img class="bg-[var(--brand,var(--secondary))]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="bg-(--brand,var(--secondary))" />`,
            svelteOutput: `<img class="bg-[var(--brand,var(--secondary))]" />`,
            vue: `<template><img class="bg-(--brand,var(--secondary))" /></template>`,
            vueOutput: `<template><img class="bg-[var(--brand,var(--secondary))]" /></template>`
          }
        ]
      }
    );
  });

  it("should preserve the case sensitivity of the variable name", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="bg-(--Brand)" />`,
            angularOutput: `<img class="bg-[var(--Brand)]" />`,
            errors: 1,
            html: `<img class="bg-(--Brand)" />`,
            htmlOutput: `<img class="bg-[var(--Brand)]" />`,
            jsx: `() => <img class="bg-(--Brand)" />`,
            jsxOutput: `() => <img class="bg-[var(--Brand)]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="bg-(--Brand)" />`,
            svelteOutput: `<img class="bg-[var(--Brand)]" />`,
            vue: `<template><img class="bg-(--Brand)" /></template>`,
            vueOutput: `<template><img class="bg-[var(--Brand)]" /></template>`
          },
          {
            angular: `<img class="bg-[var(--Brand)]" />`,
            angularOutput: `<img class="bg-(--Brand)" />`,
            errors: 1,
            html: `<img class="bg-[var(--Brand)]" />`,
            htmlOutput: `<img class="bg-(--Brand)" />`,
            jsx: `() => <img class="bg-[var(--Brand)]" />`,
            jsxOutput: `() => <img class="bg-(--Brand)" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="bg-[var(--Brand)]" />`,
            svelteOutput: `<img class="bg-(--Brand)" />`,
            vue: `<template><img class="bg-[var(--Brand)]" /></template>`,
            vueOutput: `<template><img class="bg-(--Brand)" /></template>`
          }
        ]
      }
    );
  });

  it("should preserve allow special characters in variable names", () => {
    lint(
      enforceConsistentVariableSyntax,
      TEST_SYNTAXES,
      {
        invalid: [
          {
            angular: `<img class="bg-(--special_variable_😏)" />`,
            angularOutput: `<img class="bg-[var(--special_variable_😏)]" />`,
            errors: 1,
            html: `<img class="bg-(--special_variable_😏)" />`,
            htmlOutput: `<img class="bg-[var(--special_variable_😏)]" />`,
            jsx: `() => <img class="bg-(--special_variable_😏)" />`,
            jsxOutput: `() => <img class="bg-[var(--special_variable_😏)]" />`,
            options: [{ syntax: "arbitrary" }],
            svelte: `<img class="bg-(--special_variable_😏)" />`,
            svelteOutput: `<img class="bg-[var(--special_variable_😏)]" />`,
            vue: `<template><img class="bg-(--special_variable_😏)" /></template>`,
            vueOutput: `<template><img class="bg-[var(--special_variable_😏)]" /></template>`
          },
          {
            angular: `<img class="bg-[var(--special_variable_😏)]" />`,
            angularOutput: `<img class="bg-(--special_variable_😏)" />`,
            errors: 1,
            html: `<img class="bg-[var(--special_variable_😏)]" />`,
            htmlOutput: `<img class="bg-(--special_variable_😏)" />`,
            jsx: `() => <img class="bg-[var(--special_variable_😏)]" />`,
            jsxOutput: `() => <img class="bg-(--special_variable_😏)" />`,
            options: [{ syntax: "parentheses" }],
            svelte: `<img class="bg-[var(--special_variable_😏)]" />`,
            svelteOutput: `<img class="bg-(--special_variable_😏)" />`,
            vue: `<template><img class="bg-[var(--special_variable_😏)]" /></template>`,
            vueOutput: `<template><img class="bg-(--special_variable_😏)" /></template>`
          }
        ]
      }
    );
  });
});
