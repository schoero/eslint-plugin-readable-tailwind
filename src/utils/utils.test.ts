import { describe, expect, it } from "vitest";

import { matchesName } from "readable-tailwind:utils:utils.js";


describe("matchesName", () => {
  it("should match name", () => {
    expect(matchesName("class", "class")).toBe(true);
  });

  it("should not match partial matches", () => {
    expect(matchesName("class", "className")).toBe(false);
  });

  it("should match by regex", () => {
    expect(matchesName("class.*", "className")).toBe(true);
    expect(matchesName("class$", "class$")).toBe(false);
    expect(matchesName("class\\$", "class$")).toBe(true);
  });
});
