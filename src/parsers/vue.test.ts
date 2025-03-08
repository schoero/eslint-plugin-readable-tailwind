import { describe, it } from "vitest";

import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";
import { lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";
import { MatcherType } from "readable-tailwind:types:rule.js";


describe("vue", () => {

  it("should match attribute names via regex", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ attributes: [".*Attribute"], order: "asc" }],
          vue: `<template><img customAttribute="b a" /></template>`,
          vueOutput: `<template><img customAttribute="a b" /></template>`
        }
      ]
    });
  });

  it("should work in objects in bound classes", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ order: "asc" }],
          vue: `<template><img v-bind:class="{ 'c b a': condition === 'c b a' }" /></template>`,
          vueOutput: `<template><img v-bind:class="{ 'a b c': condition === 'c b a' }" /></template>`
        },
        {
          errors: 1,
          options: [{ order: "asc" }],
          vue: `<template><img :class="{ 'c b a': condition === 'c b a' }" /></template>`,
          vueOutput: `<template><img :class="{ 'a b c': condition === 'c b a' }" /></template>`
        }
      ]
    });
  });

  it("should work in arrays in bound classes", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          options: [{ order: "asc" }],
          vue: `<template><img v-bind:class="[condition === 'c b a' ? 'c b a' : 'f e d']" /></template>`,
          vueOutput: `<template><img v-bind:class="[condition === 'c b a' ? 'a b c' : 'd e f']" /></template>`
        },
        {
          errors: 2,
          options: [{ order: "asc" }],
          vue: `<template><img :class="[condition === 'c b a' ? 'c b a' : 'f e d']" /></template>`,
          vueOutput: `<template><img :class="[condition === 'c b a' ? 'a b c' : 'd e f']" /></template>`
        }
      ]
    });
  });

  it("should evaluate bound classes", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ callees: ["defined"], order: "asc" }],
          vue: `<template><img v-bind:class="defined('c b a')" /></template>`,
          vueOutput: `<template><img v-bind:class="defined('a b c')" /></template>`
        },
        {
          errors: 1,
          options: [{ callees: ["defined"], order: "asc" }],
          vue: `<template><img :class="defined('c b a')" /></template>`,
          vueOutput: `<template><img :class="defined('a b c')" /></template>`
        }
      ]
    });
  });

  it("should automatically prefix bound classes", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ attributes: [[":custom-class", [{ match: MatcherType.String }]]], order: "asc" }],
          vue: `<template><img v-bind:custom-class="['c b a']" /></template>`,
          vueOutput: `<template><img v-bind:custom-class="['a b c']" /></template>`
        },
        {
          errors: 1,
          options: [{ attributes: [["v-bind:custom-class", [{ match: MatcherType.String }]]], order: "asc" }],
          vue: `<template><img :custom-class="['c b a']" /></template>`,
          vueOutput: `<template><img :custom-class="['a b c']" /></template>`
        }
      ]
    });
  });

  it("should match bound classes via regex", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ attributes: [[":.*Styles$", [{ match: MatcherType.String }]]], order: "asc" }],
          vue: `<template><img v-bind:testStyles="['c b a']" /></template>`,
          vueOutput: `<template><img v-bind:testStyles="['a b c']" /></template>`
        }
      ]
    });
  });

});
