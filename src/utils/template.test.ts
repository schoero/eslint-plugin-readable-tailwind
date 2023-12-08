import { describe, expect, it } from "vitest";

import { ts } from "./template";


describe("template utils", () => {

  it("should inject variables correctly", () => {
    const vars = "test";
    const test = ts`const test = "${vars}";`;
    expect(test).toBe("const test = \"test\";");
  });

  it("should remove common white spaces from tagged template literals", () => {
    const test = ts`
      const test = "test";
    `;
    expect(test).toBe("const test = \"test\";");
  });

});
