import { describe, expect, it } from "vitest";

import { DEFAULT_SELECTORS } from "better-tailwindcss:options/default-options.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";
import { getFilesInDirectory, lint } from "better-tailwindcss:tests/utils/lint.js";
import { SelectorKind } from "better-tailwindcss:types/rule.js";

import {
  angular,
  astro,
  html,
  preact,
  qwik,
  react,
  solid,
  svelte,
  variables,
  vue
} from "./presets.js";
import * as presets from "./presets.js";


describe("presets", () => {

  it("should export a preset for every utility", () => {
    const utilities = [
      ...getFilesInDirectory("./src/options/callees/"),
      ...getFilesInDirectory("./src/options/tags/")
    ].map(file => file.replace(".ts", ""));

    for(const utility of utilities){
      expect(presets).toHaveProperty(utility);
    }
  });

  it("should export a preset for every framework", () => {
    const frameworks = getFilesInDirectory("./src/options/frameworks/")
      .map(file => file.replace(".ts", ""));

    for(const framework of frameworks){
      expect(presets).toHaveProperty(framework);
    }
  });

  it("should only contain utility and variable selectors that are also part of the defaults", () => {
    const frameworks: unknown[] = [angular, astro, html, preact, qwik, react, solid, svelte, vue];
    const others = Object.values(presets).filter(preset => !frameworks.includes(preset));

    for(const selector of others.flat()){
      expect(DEFAULT_SELECTORS).toContainEqual(selector);
    }
  });

  it("should only contain attribute selectors in framework presets", () => {
    for(const selector of [angular, astro, html, preact, qwik, react, solid, svelte, vue].flat()){
      expect(selector.kind).toBe(SelectorKind.Attribute);
    }
  });

  it("should lint the class attribute with the html preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          html: `<img class=" lint " />`,
          htmlOutput: `<img class="lint" />`,

          errors: 2,
          options: [{ selectors: html }]
        }
      ]
    });
  });

  it("should only lint the className attribute with the react preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          jsx: `<img className=" lint " class=" ignore " />`,
          jsxOutput: `<img className="lint" class=" ignore " />`,

          errors: 2,
          options: [{ selectors: react }]
        },
        {
          jsx: `<img className={" lint "} />`,
          jsxOutput: `<img className={"lint"} />`,

          errors: 2,
          options: [{ selectors: react }]
        }
      ]
    });
  });

  it("should lint the class and className attributes with the preact preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          jsx: `<img class=" lint " className={" lint "} classList={{ " ignore ": true }} />`,
          jsxOutput: `<img class="lint" className={"lint"} classList={{ " ignore ": true }} />`,

          errors: 4,
          options: [{ selectors: preact }]
        }
      ]
    });
  });

  it("should only lint the class attribute with the qwik preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          jsx: `<img class={[" lint ", " lint "]} className=" ignore " />`,
          jsxOutput: `<img class={["lint", "lint"]} className=" ignore " />`,

          errors: 4,
          options: [{ selectors: qwik }]
        }
      ]
    });
  });

  it("should lint the classList attribute with the solid preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          jsx: `<img class=" lint " classList={{ " lint ": true }} className=" ignore " />`,
          jsxOutput: `<img class="lint" classList={{ "lint": true }} className=" ignore " />`,

          errors: 4,
          options: [{ selectors: solid }]
        }
      ]
    });
  });

  it("should lint class bindings with the vue preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          vue: `<template><img class=" lint " :class="{ ' lint ': true }" /></template>`,
          vueOutput: `<template><img class="lint" :class="{ 'lint': true }" /></template>`,

          errors: 4,
          options: [{ selectors: vue }]
        }
      ]
    });
  });

  it("should lint class attributes with the svelte preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          svelte: `<img class=" lint " />`,
          svelteOutput: `<img class="lint" />`,

          errors: 2,
          options: [{ selectors: svelte }]
        },
        {
          svelte: `<img class={" lint "} />`,
          svelteOutput: `<img class={"lint"} />`,

          errors: 2,
          options: [{ selectors: svelte }]
        }
      ]
    });
  });

  it("should lint the class:list attribute with the astro preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          astro: `<img class=" lint " class:list={[" lint ", { " lint ": true }]} />`,
          astroOutput: `<img class="lint" class:list={["lint", { "lint": true }]} />`,

          errors: 6,
          options: [{ selectors: astro }]
        }
      ]
    });
  });

  it("should lint class bindings with the angular preset", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          angular: `<img class=" lint " [ngClass]="{ ' lint ': true }" [class]="' lint '" />`,
          angularOutput: `<img class="lint" [ngClass]="{ 'lint': true }" [class]="'lint'" />`,

          errors: 6,
          options: [{ selectors: angular }]
        }
      ]
    });
  });

  it("should be combinable", () => {
    lint(noUnnecessaryWhitespace, {
      invalid: [
        {
          jsx: `
            const classes = " lint ";
            <img className={cn(" lint ")} />;
            <img className={clsx(" ignore ")} />;
          `,
          jsxOutput: `
            const classes = "lint";
            <img className={cn("lint")} />;
            <img className={clsx(" ignore ")} />;
          `,

          errors: 4,
          options: [{ selectors: [...react, ...presets.cn, ...variables] }]
        }
      ]
    });
  });

});
