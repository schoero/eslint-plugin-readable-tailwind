import { describe, expect, it } from "vitest";

import { escapeNestedQuotes } from "better-tailwindcss:utils/quotes.js";


describe("escapeNestedQuotes", () => {
  it("should escape all nested quotes", () => {
    expect(escapeNestedQuotes('content-[""]', "\"")).toBe('content-[\\"\\"]');
    expect(escapeNestedQuotes("content-['']", "'")).toBe("content-[\\'\\']");
  });

  it("should not escape quotes that are not nested", () => {
    expect(escapeNestedQuotes('content-[""]', "'")).toBe('content-[""]');
    expect(escapeNestedQuotes("content-['']", "\"")).toBe("content-['']");
  });
});
