import { describe, it } from "vitest";

import { tailwindMultiline } from "readable-tailwind:rules:tailwind-multiline.js";
import { tailwindSortClasses } from "readable-tailwind:rules:tailwind-sort-classes.js";
import { createTrimTag, lint, TEST_SYNTAXES } from "readable-tailwind:tests:utils.js";


describe("svelte", () => {

  it("should match attribute names via regex", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ attributes: [".*Attribute"], order: "asc" }],
          svelte: `<img customAttribute="b a" />`,
          svelteOutput: `<img customAttribute="a b" />`
        }
      ]
    });
  });

  // #42
  it("should work with shorthand attributes", () => {
    lint(tailwindSortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 1,
          options: [{ order: "asc" }],
          svelte: `<script>let disabled = true;</script><img class="c b a" {disabled} />`,
          svelteOutput: `<script>let disabled = true;</script><img class="a b c" {disabled} />`
        }
      ]
    });
  });

  it("should change the quotes in expressions to backticks", () => {
    const trim = createTrimTag(4);

    const singleline = "a b c d e f";
    const multiline = trim`
      a b c
      d e f
    `;

    lint(tailwindMultiline, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          options: [{ classesPerLine: 3 }],
          svelte: `<img class={true ? '${singleline}' : '${singleline}'} />`,
          svelteOutput: `<img class={true ? \`${multiline}\` : \`${multiline}\`} />`
        }
      ]
    });
  });

});
