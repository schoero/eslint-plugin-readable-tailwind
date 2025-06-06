import { describe, it } from "vitest";

import { multiline } from "better-tailwindcss:rules/multiline.js";
import { sortClasses } from "better-tailwindcss:rules/sort-classes.js";
import { createTrimTag, lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils.js";


describe("svelte", () => {

  it("should match attribute names via regex", () => {
    lint(sortClasses, TEST_SYNTAXES, {
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
    lint(sortClasses, TEST_SYNTAXES, {
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

    const singleLine = "a b c d e f";
    const multiLine = trim`
      a b c
      d e f
    `;

    lint(multiline, TEST_SYNTAXES, {
      invalid: [
        {
          errors: 2,
          options: [{ classesPerLine: 3 }],
          svelte: `<img class={true ? '${singleLine}' : '${singleLine}'} />`,
          svelteOutput: `<img class={true ? \`${multiLine}\` : \`${multiLine}\`} />`
        }
      ]
    });
  });

});
