import { equal } from "node:assert";
import { describe, it } from "node:test";

import { escapeNestedQuotes } from "readable-tailwind:utils:quotes.js";


describe("escapeNestedQuotes", () => {
  it("should escape all nested quotes", () => {
    equal(escapeNestedQuotes('content-[""]', "\""), 'content-[\\"\\"]');
    equal(escapeNestedQuotes("content-['']", "'"), "content-[\\'\\']");
  });

  it("should not escape quotes that are not nested", () => {
    equal(escapeNestedQuotes('content-[""]', "'"), 'content-[""]');
    equal(escapeNestedQuotes("content-['']", "\""), "content-['']");
  });
});
