import { tsx } from "src/utils/template.js";
import { lint } from "tests/utils.js";
import { describe, expect, it } from "vitest";

import sortRule from "eptm:rules:sort.js";


describe("sort", () => {

  it("should sort simple class names alphabetically", () => expect(void lint("sort", sortRule, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="b a" />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="a b" />;`
      }
    ],
    valid: [
      { code: tsx`const Test = () => <div class="a b" />;` }
    ]
  })).toBeUndefined());

  it("should trim leading and trailing white space in simple literals", () => expect(void lint("sort", sortRule, {
    invalid: [
      {
        code: tsx`const Test = () => <div class=" b a " />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="a b" />;`
      }
    ]
  })).toBeUndefined());

  it("should sort class names with modifiers alphabetically", () => expect(void lint("sort", sortRule, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="b:class a:class" />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="a:class b:class" />;`
      }
    ],
    valid: [
      { code: tsx`const Test = () => <div class="a:class b:class" />;` }
    ]
  })).toBeUndefined());

  it("should not change the quotes", () => expect(void lint("sort", sortRule, {
    invalid: [
      {
        code: tsx`const Test = () => <div class="b a" />;`,
        errors: 1,
        output: tsx`const Test = () => <div class="a b" />;`
      },
      {
        code: tsx`const Test = () => <div class='b a' />;`,
        errors: 1,
        output: tsx`const Test = () => <div class='a b' />;`
      },
      {
        code: "const Test = () => <div class={`b a`} />;",
        errors: 1,
        output: "const Test = () => <div class={`a b`} />;"
      }
    ],
    valid: [
      { code: "const Test = () => <div class={`a b`} />;" }
    ]
  })).toBeUndefined());

  it("should keep expressions as they are", () => expect(void lint("sort", sortRule, {
    valid: [
      { code: tsx`const Test = () => <div class={true ? "a" : "b"} />;` }
    ]
  })).toBeUndefined());

  it("should keep expressions where they are", () => expect(void lint("sort", sortRule, {
    invalid: [
      {
        code: "const Test = () => <div class={`c a ${true ? 'e' : 'f'} b `} />;",
        errors: 1,
        output: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b `} />;"
      }
    ],
    valid: [
      { code: "const Test = () => <div class={`a c ${true ? 'e' : 'f'} b `} />;" }
    ]
  })).toBeUndefined());


});
