import { describe, it } from "vitest";

import { enforceLogicalProperties } from "better-tailwindcss:rules/enforce-logical-properties.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";
import { css } from "better-tailwindcss:tests/utils/template.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version.js";


const testCases = [
  ["pl-4", "ps-4"],
  ["pr-4", "pe-4"],
  ["pt-4", "pbs-4"],
  ["pb-4", "pbe-4"],
  ["ml-4", "ms-4"],
  ["mr-4", "me-4"],
  ["mt-4", "mbs-4"],
  ["mb-4", "mbe-4"],

  ["scroll-pl-4", "scroll-ps-4"],
  ["scroll-pr-4", "scroll-pe-4"],
  ["scroll-pt-4", "scroll-pbs-4"],
  ["scroll-pb-4", "scroll-pbe-4"],
  ["scroll-ml-4", "scroll-ms-4"],
  ["scroll-mr-4", "scroll-me-4"],
  ["scroll-mt-4", "scroll-mbs-4"],
  ["scroll-mb-4", "scroll-mbe-4"],

  ["left-4", "inset-s-4"],
  ["right-4", "inset-e-4"],
  ["top-4", "inset-bs-4"],
  ["bottom-4", "inset-be-4"],

  ["border-l", "border-s"],
  ["border-r", "border-e"],
  ["border-t", "border-bs"],
  ["border-b", "border-be"],
  ["border-l-2", "border-s-2"],
  ["border-r-2", "border-e-2"],
  ["border-t-2", "border-bs-2"],
  ["border-b-2", "border-be-2"],

  ["rounded-l", "rounded-s"],
  ["rounded-r", "rounded-e"],
  ["rounded-l-lg", "rounded-s-lg"],
  ["rounded-r-lg", "rounded-e-lg"],

  ["rounded-tl", "rounded-ss"],
  ["rounded-tr", "rounded-se"],
  ["rounded-br", "rounded-ee"],
  ["rounded-bl", "rounded-es"],
  ["rounded-tl-lg", "rounded-ss-lg"],
  ["rounded-tr-lg", "rounded-se-lg"],
  ["rounded-br-lg", "rounded-ee-lg"],
  ["rounded-bl-lg", "rounded-es-lg"],

  ["text-left", "text-start"],
  ["text-right", "text-end"],

  ["float-left", "float-start"],
  ["float-right", "float-end"],
  ["clear-left", "clear-start"],
  ["clear-right", "clear-end"],

  ["h-4", "block-4"],
  ["w-4", "inline-4"],
  ["min-h-4", "min-block-4"],
  ["min-w-4", "min-inline-4"],
  ["max-h-4", "max-block-4"],
  ["max-w-4", "max-inline-4"]
] satisfies [string, string][];

describe.runIf(getTailwindCSSVersion().major >= 4)(enforceLogicalProperties.name, () => {

  it("should not report valid classes", () => {
    lint(
      enforceLogicalProperties,
      {
        valid: [
          {
            angular: `<img class="ps-4 pbs-2 ms-2 mbs-1 text-start float-start clear-end scroll-ps-2 scroll-pbs-2 inset-bs-2 border-bs rounded-bs" />`,
            html: `<img class="ps-4 pbs-2 ms-2 mbs-1 text-start float-start clear-end scroll-ps-2 scroll-pbs-2 inset-bs-2 border-bs rounded-bs" />`,
            jsx: `() => <img class="ps-4 pbs-2 ms-2 mbs-1 text-start float-start clear-end scroll-ps-2 scroll-pbs-2 inset-bs-2 border-bs rounded-bs" />`,
            svelte: `<img class="ps-4 pbs-2 ms-2 mbs-1 text-start float-start clear-end scroll-ps-2 scroll-pbs-2 inset-bs-2 border-bs rounded-bs" />`,
            vue: `<template><img class="ps-4 pbs-2 ms-2 mbs-1 text-start float-start clear-end scroll-ps-2 scroll-pbs-2 inset-bs-2 border-bs rounded-bs" /></template>`
          }
        ]
      }
    );
  });

  it("should fix classes with variants", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="hover:pl-4 md:right-2" />`,
            angularOutput: `<img class="hover:ps-4 md:inset-e-2" />`,
            html: `<img class="hover:pl-4 md:right-2" />`,
            htmlOutput: `<img class="hover:ps-4 md:inset-e-2" />`,
            jsx: `() => <img class="hover:pl-4 md:right-2" />`,
            jsxOutput: `() => <img class="hover:ps-4 md:inset-e-2" />`,
            svelte: `<img class="hover:pl-4 md:right-2" />`,
            svelteOutput: `<img class="hover:ps-4 md:inset-e-2" />`,
            vue: `<template><img class="hover:pl-4 md:right-2" /></template>`,
            vueOutput: `<template><img class="hover:ps-4 md:inset-e-2" /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should keep the important modifier", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="!text-left" />`,
            angularOutput: `<img class="!text-start" />`,
            html: `<img class="!text-left" />`,
            htmlOutput: `<img class="!text-start" />`,
            jsx: `() => <img class="!text-left" />`,
            jsxOutput: `() => <img class="!text-start" />`,
            svelte: `<img class="!text-left" />`,
            svelteOutput: `<img class="!text-start" />`,
            vue: `<template><img class="!text-left" /></template>`,
            vueOutput: `<template><img class="!text-start" /></template>`,

            errors: 1
          },
          {
            angular: `<img class="text-right!" />`,
            angularOutput: `<img class="text-end!" />`,
            html: `<img class="text-right!" />`,
            htmlOutput: `<img class="text-end!" />`,
            jsx: `() => <img class="text-right!" />`,
            jsxOutput: `() => <img class="text-end!" />`,
            svelte: `<img class="text-right!" />`,
            svelteOutput: `<img class="text-end!" />`,
            vue: `<template><img class="text-right!" /></template>`,
            vueOutput: `<template><img class="text-end!" /></template>`,

            errors: 1
          },
          {
            angular: `<img class="size-4!" />`,
            angularOutput: `<img class="block-4! inline-4!" />`,
            html: `<img class="size-4!" />`,
            htmlOutput: `<img class="block-4! inline-4!" />`,
            jsx: `() => <img class="size-4!" />`,
            jsxOutput: `() => <img class="block-4! inline-4!" />`,
            svelte: `<img class="size-4!" />`,
            svelteOutput: `<img class="block-4! inline-4!" />`,
            vue: `<template><img class="size-4!" /></template>`,
            vueOutput: `<template><img class="block-4! inline-4!" /></template>`,

            errors: 1
          }
        ]
      }
    );
  });

  it("should keep negative classes", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="-ml-4 -right-2" />`,
            angularOutput: `<img class="-ms-4 -inset-e-2" />`,
            html: `<img class="-ml-4 -right-2" />`,
            htmlOutput: `<img class="-ms-4 -inset-e-2" />`,
            jsx: `() => <img class="-ml-4 -right-2" />`,
            jsxOutput: `() => <img class="-ms-4 -inset-e-2" />`,
            svelte: `<img class="-ml-4 -right-2" />`,
            svelteOutput: `<img class="-ms-4 -inset-e-2" />`,
            vue: `<template><img class="-ml-4 -right-2" /></template>`,
            vueOutput: `<template><img class="-ms-4 -inset-e-2" /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should keep arbitrary values", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="ml-[12px] left-[calc(100%-1rem)]" />`,
            angularOutput: `<img class="ms-[12px] inset-s-[calc(100%-1rem)]" />`,
            html: `<img class="ml-[12px] left-[calc(100%-1rem)]" />`,
            htmlOutput: `<img class="ms-[12px] inset-s-[calc(100%-1rem)]" />`,
            jsx: `() => <img class="ml-[12px] left-[calc(100%-1rem)]" />`,
            jsxOutput: `() => <img class="ms-[12px] inset-s-[calc(100%-1rem)]" />`,
            svelte: `<img class="ml-[12px] left-[calc(100%-1rem)]" />`,
            svelteOutput: `<img class="ms-[12px] inset-s-[calc(100%-1rem)]" />`,
            vue: `<template><img class="ml-[12px] left-[calc(100%-1rem)]" /></template>`,
            vueOutput: `<template><img class="ms-[12px] inset-s-[calc(100%-1rem)]" /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

  it("should keep the tailwindcss prefix", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="tw:pl-4 tw:text-right" />`,
            angularOutput: `<img class="tw:ps-4 tw:text-end" />`,
            html: `<img class="tw:pl-4 tw:text-right" />`,
            htmlOutput: `<img class="tw:ps-4 tw:text-end" />`,
            jsx: `() => <img class="tw:pl-4 tw:text-right" />`,
            jsxOutput: `() => <img class="tw:ps-4 tw:text-end" />`,
            svelte: `<img class="tw:pl-4 tw:text-right" />`,
            svelteOutput: `<img class="tw:ps-4 tw:text-end" />`,
            vue: `<template><img class="tw:pl-4 tw:text-right" /></template>`,
            vueOutput: `<template><img class="tw:ps-4 tw:text-end" /></template>`,

            errors: 2,
            files: {
              "tailwind.css": css`
                @import "tailwindcss" prefix(tw);
              `
            },
            options: [{
              entryPoint: "./tailwind.css"
            }]
          }
        ]
      }
    );
  });

  it("should ignore configured classes", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="pl-4 pr-4" />`,
            angularOutput: `<img class="ps-4 pr-4" />`,
            html: `<img class="pl-4 pr-4" />`,
            htmlOutput: `<img class="ps-4 pr-4" />`,
            jsx: `() => <img class="pl-4 pr-4" />`,
            jsxOutput: `() => <img class="ps-4 pr-4" />`,
            svelte: `<img class="pl-4 pr-4" />`,
            svelteOutput: `<img class="ps-4 pr-4" />`,
            vue: `<template><img class="pl-4 pr-4" /></template>`,
            vueOutput: `<template><img class="ps-4 pr-4" /></template>`,

            errors: 1,

            options: [{
              ignore: ["^pr-"]
            }]
          }
        ],
        valid: [
          {
            angular: `<img class="pl-4 pr-4" />`,
            html: `<img class="pl-4 pr-4" />`,
            jsx: `() => <img class="pl-4 pr-4" />`,
            svelte: `<img class="pl-4 pr-4" />`,
            vue: `<template><img class="pl-4 pr-4" /></template>`,

            options: [{
              ignore: ["^pl-", "^pr-"]
            }]
          }
        ]
      }
    );
  });

  it.each(testCases)(`should report "%s"`, (input, output) => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="${input}" />`,
            angularOutput: `<img class="${output}" />`,
            html: `<img class="${input}" />`,
            htmlOutput: `<img class="${output}" />`,
            jsx: `() => <img class="${input}" />`,
            jsxOutput: `() => <img class="${output}" />`,
            svelte: `<img class="${input}" />`,
            svelteOutput: `<img class="${output}" />`,
            vue: `<template><img class="${input}" /></template>`,
            vueOutput: `<template><img class="${output}" /></template>`,

            errors: 1
          }
        ]
      }
    );
  });

  it("should split size classes into logical block and inline classes", () => {
    lint(
      enforceLogicalProperties,
      {
        invalid: [
          {
            angular: `<img class="size-4 hover:size-[12px]" />`,
            angularOutput: `<img class="block-4 inline-4 hover:block-[12px] hover:inline-[12px]" />`,
            html: `<img class="size-4 hover:size-[12px]" />`,
            htmlOutput: `<img class="block-4 inline-4 hover:block-[12px] hover:inline-[12px]" />`,
            jsx: `() => <img class="size-4 hover:size-[12px]" />`,
            jsxOutput: `() => <img class="block-4 inline-4 hover:block-[12px] hover:inline-[12px]" />`,
            svelte: `<img class="size-4 hover:size-[12px]" />`,
            svelteOutput: `<img class="block-4 inline-4 hover:block-[12px] hover:inline-[12px]" />`,
            vue: `<template><img class="size-4 hover:size-[12px]" /></template>`,
            vueOutput: `<template><img class="block-4 inline-4 hover:block-[12px] hover:inline-[12px]" /></template>`,

            errors: 2
          }
        ]
      }
    );
  });

});
