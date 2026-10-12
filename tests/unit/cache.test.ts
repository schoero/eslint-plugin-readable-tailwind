import { rmSync, utimesSync, writeFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TestDirectory } from "better-tailwindcss:tests/utils/tmp.js";
import { Cache, invalidateByModifiedDate, invalidateByTagChange } from "better-tailwindcss:utils/cache.js";


describe("cache", () => {

  beforeEach(() => {
    Cache.clear();
  });

  afterEach(() => {
    Cache.clear();
  });

  describe.each(["shared", "isolated"])("isValid (%s cache)", cacheType => {

    const options = () => ({ cache: cacheType === "shared" ? Cache.SHARED_CACHE : Cache.ISOLATED_CACHE });

    it("should return false for a missing entry even when invalidation is disabled", () => {
      expect(Cache.isValid("missing", options())).toBe(false);
      expect(Cache.isValid("missing", { ...options(), invalidate: false })).toBe(false);
    });

    it("should return true for a cached undefined value", () => {
      Cache.set("undefined", undefined, options());
      expect(Cache.isValid("undefined", options())).toBe(true);
    });

    it("should check tags without removing or updating stale entries", () => {
      Cache.set("tags", "value", { ...options(), tag: ["a", "b"] });

      expect(Cache.isValid("tags", { ...options(), tag: ["a", "b"] })).toBe(true);
      expect(Cache.isValid("tags", { ...options(), tag: ["a", "c"] })).toBe(false);
      expect(Cache.isValid("tags", { ...options(), tag: ["a"] })).toBe(false);
      expect(Cache.get("tags", () => "fallback", { ...options(), tag: ["a", "b"] })).toBe("value");
    });

    it("should check modification dates and missing files", () => {
      using testDirectory = new TestDirectory({
        "validity.txt": "content"
      });
      const filePath = testDirectory.files["validity.txt"].path;
      utimesSync(filePath, new Date(0), new Date(0));
      Cache.set("path", "value", { ...options(), path: filePath });

      expect(Cache.isValid("path", { ...options(), path: filePath })).toBe(true);

      const future = new Date(Date.now() + 10_000);
      utimesSync(filePath, future, future);
      expect(Cache.isValid("path", { ...options(), path: filePath })).toBe(false);

      rmSync(filePath);
      expect(Cache.isValid("path", { ...options(), path: filePath })).toBe(false);
    });

    it("should check both paths and tags", () => {
      using testDirectory = new TestDirectory({
        "validity-tag.txt": "content"
      });
      const filePath = testDirectory.files["validity-tag.txt"].path;
      utimesSync(filePath, new Date(0), new Date(0));
      Cache.set("path-tag", "value", { ...options(), path: filePath, tag: "a" });

      expect(Cache.isValid("path-tag", { ...options(), path: filePath, tag: "a" })).toBe(true);
      expect(Cache.isValid("path-tag", { ...options(), path: filePath, tag: "b" })).toBe(false);
    });

    it("should run custom invalidators with the normalized source", () => {
      Cache.set("custom", "value", { ...options(), tag: "a" });

      expect(Cache.isValid("custom", {
        ...options(),
        invalidate: (cached, source) => {
          expect(cached.tag).toEqual(["a"]);
          expect(source).toEqual(["a"]);
          return true;
        },
        tag: "a"
      })).toBe(false);
      expect(Cache.isValid("custom", { ...options(), invalidate: () => false })).toBe(true);
    });

    it("should skip all invalidators when invalidation is disabled", () => {
      Cache.set("disabled", "value", { ...options(), path: "/missing", tag: "a" });

      expect(Cache.isValid("disabled", { ...options(), invalidate: false, path: "/missing", tag: "b" })).toBe(true);
    });

  });

  describe("tag invalidation", () => {

    it("should return a cached value when a single tag has not changed", () => {
      let calls = 0;

      const value = Cache.get("single-tag", () => {
        calls++;
        return "value";
      }, { tag: "tag-a" });

      expect(value).toBe("value");
      expect(calls).toBe(1);

      const cachedValue = Cache.get("single-tag", () => {
        calls++;
        return "new-value";
      }, { tag: "tag-a" });

      expect(cachedValue).toBe("value");
      expect(calls).toBe(1);
    });

    it("should invalidate the cache when a single tag changes", () => {
      let calls = 0;

      Cache.get("single-tag-change", () => {
        calls++;
        return "value";
      }, { tag: "tag-a" });

      const value = Cache.get("single-tag-change", () => {
        calls++;
        return "new-value";
      }, { tag: "tag-b" });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should return a cached value when all array tags are unchanged", () => {
      let calls = 0;

      Cache.get("array-tags", () => {
        calls++;
        return "value";
      }, { tag: ["tag-a", "tag-b"] });

      const cachedValue = Cache.get("array-tags", () => {
        calls++;
        return "new-value";
      }, { tag: ["tag-a", "tag-b"] });

      expect(cachedValue).toBe("value");
      expect(calls).toBe(1);
    });

    it("should invalidate the cache when any array tag changes", () => {
      let calls = 0;

      Cache.get("array-tags-change", () => {
        calls++;
        return "value";
      }, { tag: ["tag-a", "tag-b"] });

      const value = Cache.get("array-tags-change", () => {
        calls++;
        return "new-value";
      }, { tag: ["tag-a", "tag-c"] });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should invalidate the cache when the number of tags changes", () => {
      let calls = 0;

      Cache.get("array-tags-length", () => {
        calls++;
        return "value";
      }, { tag: ["tag-a"] });

      const value = Cache.get("array-tags-length", () => {
        calls++;
        return "new-value";
      }, { tag: ["tag-a", "tag-b"] });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should filter out undefined tags like CacheKey", () => {
      let calls = 0;

      Cache.get("array-tags-undefined", () => {
        calls++;
        return "value";
      }, { tag: ["tag-a", undefined, "tag-b"] as unknown as string[] });

      const cachedValue = Cache.get("array-tags-undefined", () => {
        calls++;
        return "new-value";
      }, { tag: ["tag-a", "tag-b"] });

      expect(cachedValue).toBe("value");
      expect(calls).toBe(1);
    });

  });

  describe("path invalidation", () => {

    it("should return a cached value when a single path has not been modified", async () => {
      using testDirectory = new TestDirectory({
        "single-path.txt": "content"
      });
      const filePath = testDirectory.files["single-path.txt"].path;
      let calls = 0;

      await new Promise(resolve => setTimeout(resolve, 10));

      Cache.get("single-path", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: filePath });

      const cachedValue = Cache.get("single-path", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: filePath });

      expect(cachedValue).toBe("value");
      expect(calls).toBe(1);
    });

    it("should invalidate the cache when a single path is modified", async () => {
      using testDirectory = new TestDirectory({
        "modified-path.txt": "content"
      });
      const filePath = testDirectory.files["modified-path.txt"].path;
      let calls = 0;

      Cache.get("modified-path", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: filePath });

      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(filePath, "updated content");

      const value = Cache.get("modified-path", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: filePath });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should return a cached value when all array paths are unchanged", async () => {
      using testDirectory = new TestDirectory({
        "array-path-a.txt": "content-a",
        "array-path-b.txt": "content-b"
      });
      const filePathA = testDirectory.files["array-path-a.txt"].path;
      const filePathB = testDirectory.files["array-path-b.txt"].path;
      let calls = 0;

      await new Promise(resolve => setTimeout(resolve, 10));

      Cache.get("array-paths", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathB] });

      const cachedValue = Cache.get("array-paths", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathB] });

      expect(cachedValue).toBe("value");
      expect(calls).toBe(1);
    });

    it("should invalidate the cache when any array path is modified", async () => {
      using testDirectory = new TestDirectory({
        "array-path-modified-a.txt": "content-a",
        "array-path-modified-b.txt": "content-b"
      });
      const filePathA = testDirectory.files["array-path-modified-a.txt"].path;
      const filePathB = testDirectory.files["array-path-modified-b.txt"].path;
      let calls = 0;

      Cache.get("array-paths-modified", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathB] });

      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(filePathB, "updated content");

      const value = Cache.get("array-paths-modified", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathB] });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should invalidate the cache when any of the paths changes", () => {
      using testDirectory = new TestDirectory({
        "array-path-change-a.txt": "content-a",
        "array-path-change-b.txt": "content-b",
        "array-path-change-c.txt": "content-c"
      });
      const filePathA = testDirectory.files["array-path-change-a.txt"].path;
      const filePathB = testDirectory.files["array-path-change-b.txt"].path;
      const filePathC = testDirectory.files["array-path-change-c.txt"].path;
      let calls = 0;

      Cache.get("array-paths-change", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathB] });

      const value = Cache.get("array-paths-change", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathC] });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should invalidate the cache when the number of paths changes", () => {
      using testDirectory = new TestDirectory({
        "array-path-length-a.txt": "content-a",
        "array-path-length-b.txt": "content-b"
      });
      const filePathA = testDirectory.files["array-path-length-a.txt"].path;
      const filePathB = testDirectory.files["array-path-length-b.txt"].path;
      let calls = 0;

      Cache.get("array-paths-length", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA] });

      const value = Cache.get("array-paths-length", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: [filePathA, filePathB] });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

    it("should invalidate the cache when a path no longer exists", () => {
      using testDirectory = new TestDirectory({
        "missing-path.txt": "content"
      });
      const filePath = testDirectory.files["missing-path.txt"].path;
      let calls = 0;

      Cache.get("missing-path", () => {
        calls++;
        return "value";
      }, { cache: Cache.ISOLATED_CACHE, path: filePath });

      rmSync(filePath);

      const value = Cache.get("missing-path", () => {
        calls++;
        return "new-value";
      }, { cache: Cache.ISOLATED_CACHE, path: filePath });

      expect(value).toBe("new-value");
      expect(calls).toBe(2);
    });

  });

  describe("readFile", () => {

    it("should check file cache freshness with isValid", () => {
      using testDirectory = new TestDirectory({
        "file-validity.txt": "content"
      });
      const filePath = testDirectory.files["file-validity.txt"].path;
      utimesSync(filePath, new Date(0), new Date(0));
      Cache.readFile(filePath);

      expect(Cache.isValid(filePath, { path: filePath })).toBe(true);

      const future = new Date(Date.now() + 10_000);
      utimesSync(filePath, future, future);
      expect(Cache.isValid(filePath, { path: filePath })).toBe(false);
      expect(Cache.has(filePath)).toBe(true);
    });

    it("should cache file contents and invalidate when the file is modified", async () => {
      using testDirectory = new TestDirectory({
        "cached-file.txt": "content"
      });
      const filePath = testDirectory.files["cached-file.txt"].path;

      const firstContent = Cache.readFile(filePath);
      expect(firstContent).toBe("content");

      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(filePath, "updated content");

      const secondContent = Cache.readFile(filePath);
      expect(secondContent).toBe("updated content");
    });

    it("should invalidate readFile cache when any tag in an array changes", async () => {
      using testDirectory = new TestDirectory({
        "cached-file-tags.txt": "content"
      });
      const filePath = testDirectory.files["cached-file-tags.txt"].path;

      const firstContent = Cache.readFile(filePath, { tag: ["tag-a", "tag-b"] });
      expect(firstContent).toBe("content");

      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(filePath, "updated content");

      const secondContent = Cache.readFile(filePath, { tag: ["tag-a", "tag-c"] });
      expect(secondContent).toBe("updated content");
    });

  });

  describe("invalidator helpers", () => {

    it("should invalidate when cached path and requested path differ in length", () => {
      const cacheEntry = { date: new Date(), path: ["/a"], tag: undefined, value: "value" };

      expect(invalidateByModifiedDate(cacheEntry, ["/a", "/b"])).toBe(true);
    });

    it("should invalidate when cached tag and requested tag differ at an index", () => {
      const cacheEntry = { date: new Date(), path: undefined, tag: ["a", "b"], value: "value" };

      expect(invalidateByTagChange(cacheEntry, ["a", "c"])).toBe(true);
    });

    it("should not invalidate tags when all values match", () => {
      const cacheEntry = { date: new Date(), path: undefined, tag: ["a", "b"], value: "value" };

      expect(invalidateByTagChange(cacheEntry, ["a", "b"])).toBe(false);
    });

  });

  describe("shared cache serialization round-trip", () => {

    beforeEach(() => {
      Cache.clear();
    });

    it("should round-trip a plain value with no path or tag", () => {
      Cache.set("k-plain", "value");
      expect(Cache.isValid("k-plain")).toBe(true);
      expect(Cache.get("k-plain", () => "fallback")).toBe("value");
    });

    it("should round-trip with non-ASCII tag (multibyte byteLength vs length)", () => {
      Cache.set("k-non-ascii", "value", { tag: ["héllo→世界"] });
      expect(Cache.get("k-non-ascii", () => "fallback", { tag: ["héllo→世界"] })).toBe("value");
    });

    it("should round-trip when tag is an empty string (falsy but not undefined)", () => {
      Cache.set("k-empty-string", "value", { tag: "" });
      expect(Cache.get("k-empty-string", () => "fallback", { tag: "" })).toBe("value");
    });

    it("should round-trip when path has undefined entries filtered out", () => {
      Cache.set("k-undefined-path", "value", { path: [undefined, "/tmp"] as unknown as string[] });
      expect(Cache.get("k-undefined-path", () => "fallback", { path: ["/tmp"] })).toBe("value");
    });

  });

  describe("cache key collisions", () => {

    beforeEach(() => {
      Cache.clear();
    });

    it("should not collide for ['a:b'] vs ['a', 'b']", () => {
      Cache.set(["a:b"], "joined");
      expect(Cache.get(["a", "b"], () => "split")).toBe("split");
    });

    it("should not collide for numeric key 1 vs string key '1'", () => {
      Cache.set(1, "number-one");
      expect(Cache.get("1", () => "string-one")).toBe("string-one");
    });

    it("should not collide for boolean key true vs string key 'true'", () => {
      Cache.set(true, "boolean-true");
      expect(Cache.get("true", () => "string-true")).toBe("string-true");
    });

  });

});
