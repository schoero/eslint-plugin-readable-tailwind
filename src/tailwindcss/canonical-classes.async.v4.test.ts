import { describe, expect, it } from "vitest";

import { getCanonicalClasses } from "./canonical-classes.async.v4.js";


describe("getCanonicalClasses", () => {
  it.each(["__proto__", "constructor", "toString"])("should preserve unchanged %s when canonical suggestions are unavailable", className => {
    const canonicalClasses = getCanonicalClasses({}, [className], {
      collapse: undefined,
      logicalToPhysical: undefined,
      rem: undefined
    });

    const clonedCanonicalClasses = structuredClone(canonicalClasses);

    for(const result of [canonicalClasses, clonedCanonicalClasses]){
      expect(Object.keys(result)).toEqual([className]);
      expect(result[className]).toEqual({
        input: [className],
        output: className
      });
    }
  });
});
