import { describe, it } from "vitest";

import { multiline } from "better-tailwindcss:rules/multiline.js";
import { sortClasses } from "better-tailwindcss:rules/sort-classes.js";
import { lint, TEST_SYNTAXES } from "better-tailwindcss:tests/utils/lint.js";
import { dedent } from "better-tailwindcss:tests/utils/template.js";


describe("svelte", () => {

  it("should match attribute names via regex", () => {
    lint(sortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          svelte: `<img customAttribute="b a" />`,
          svelteOutput: `<img customAttribute="a b" />`,

          errors: 1,
          options: [{ attributes: [".*Attribute"], order: "asc" }]
        }
      ]
    });
  });

  // #42
  it("should work with shorthand attributes", () => {
    lint(sortClasses, TEST_SYNTAXES, {
      invalid: [
        {
          svelte: `<script>let disabled = true;</script><img class="c b a" {disabled} />`,
          svelteOutput: `<script>let disabled = true;</script><img class="a b c" {disabled} />`,

          errors: 1,
          options: [{ order: "asc" }]
        }
      ]
    });
  });

  it("should change the quotes in expressions to backticks", () => {
    const singleLine = "a b c d e f";
    const multiLine = dedent`
      a b c
      d e f
    `;

    lint(multiline, TEST_SYNTAXES, {
      invalid: [
        {
          svelte: `<img class={true ? '${singleLine}' : '${singleLine}'} />`,
          svelteOutput: `<img class={true ? \`${multiLine}\` : \`${multiLine}\`} />`,

          errors: 2,
          options: [{ classesPerLine: 3 }]
        }
      ]
    });
  });

});
