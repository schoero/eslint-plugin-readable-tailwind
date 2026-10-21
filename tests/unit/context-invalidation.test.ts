import { statSync, utimesSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createGetCustomComponentClasses,
  getCustomComponentClasses
} from "better-tailwindcss:tailwindcss/custom-component-classes.js";
import { createGetPrefix, getPrefix } from "better-tailwindcss:tailwindcss/prefix.js";
import { createGetUnknownClasses, getUnknownClasses } from "better-tailwindcss:tailwindcss/unknown-classes.js";
import { TestDirectory } from "better-tailwindcss:tests/utils/tmp.js";
import { getTailwindCSSVersion } from "better-tailwindcss:tests/utils/version.js";
import { CachedStore } from "better-tailwindcss:utils/cached-store.js";
import { async } from "better-tailwindcss:utils/context.js";
import { getTailwindPackageJsonPath, getTailwindVersion } from "better-tailwindcss:utils/tailwindcss.js";

import type { Context } from "better-tailwindcss:types/rule.js";


const classes = ["utility-a", "utility-b"];
const isCached = () => classes.every(className => CachedStore.has(["unknown-class", className]));
const directories: TestDirectory[] = [];

function createDirectory(files: Record<string, string>) {
  const directory = new TestDirectory(files);
  directories.push(directory);
  return directory;
}

// mirrors the setup in createRule()
function createContext(directory: TestDirectory, entryPoint: string) {
  const packageJsonPath = getTailwindPackageJsonPath(directory.directory)!;
  const version = getTailwindVersion(packageJsonPath);
  const ctx = { cwd: directory.directory, installation: dirname(packageJsonPath), options: { entryPoint }, version } as unknown as Context;

  createGetCustomComponentClasses(ctx);
  createGetPrefix(ctx);
  createGetUnknownClasses(ctx);

  return ctx;
}

// only uses host cached operations, other operations would reach the worker and hide stale host results
// the cache is intentionally not cleared between calls
function getUnknown(directory: TestDirectory, entryPoint: string) {
  const asyncCtx = async(createContext(directory, entryPoint));
  const { unknownClasses } = getUnknownClasses(asyncCtx, classes);

  expect(isCached()).toBe(true);

  return unknownClasses;
}

function changeFile(path: string, content: string) {
  const timestamp = statSync(path).mtimeMs + 5000;
  writeFileSync(path, content);
  utimesSync(path, timestamp / 1000, timestamp / 1000);
}

const utility = (name: string) => `@utility ${name} { color: red; }`;

beforeEach(() => {
  CachedStore.clear();
});

afterEach(() => {
  for(const directory of directories.splice(0).reverse()){
    directory.cleanUp();
  }
});

describe.runIf(getTailwindCSSVersion().major >= 4)("tailwind context invalidation", () => {

  it("should invalidate host cached results when the config file changes", () => {
    const directory = createDirectory({ "tailwind.css": `@import "tailwindcss";\n${utility("utility-a")}` });

    expect(getUnknown(directory, "./tailwind.css")).toEqual(["utility-b"]);

    changeFile(directory.files["tailwind.css"].path, `@import "tailwindcss";\n${utility("utility-a")}\n${utility("utility-b")}`);

    expect(getUnknown(directory, "./tailwind.css")).toEqual([]);
  });

  it("should invalidate host cached results when an imported file changes", () => {
    const directory = createDirectory({
      "imported.css": utility("utility-a"),
      "tailwind.css": `@import "tailwindcss";\n@import "./imported.css";`
    });

    expect(getUnknown(directory, "./tailwind.css")).toEqual(["utility-b"]);

    changeFile(directory.files["imported.css"].path, `${utility("utility-a")}\n${utility("utility-b")}`);

    expect(getUnknown(directory, "./tailwind.css")).toEqual([]);
  });

  it("should invalidate host cached results when a nested import is added", () => {
    const directory = createDirectory({
      "imported.css": "",
      "nested.css": utility("utility-b"),
      "tailwind.css": `@import "tailwindcss";\n@import "./imported.css";\n${utility("utility-a")}`
    });

    expect(getUnknown(directory, "./tailwind.css")).toEqual(["utility-b"]);

    changeFile(directory.files["imported.css"].path, `@import "./nested.css";`);

    expect(getUnknown(directory, "./tailwind.css")).toEqual([]);

    changeFile(directory.files["nested.css"].path, "");

    expect(getUnknown(directory, "./tailwind.css")).toEqual(["utility-b"]);
  });

  it("should invalidate host cached results when the config path changes", () => {
    const directory = createDirectory({
      "a.css": `@import "tailwindcss";\n${utility("utility-a")}`,
      "ab.css": `@import "tailwindcss";\n${utility("utility-a")}\n${utility("utility-b")}`
    });

    expect(getUnknown(directory, "./a.css")).toEqual(["utility-b"]);
    expect(getUnknown(directory, "./ab.css")).toEqual([]);
    expect(getUnknown(directory, "./a.css")).toEqual(["utility-b"]);
  });

  it("should cache the prefix and custom component classes on the host until the config changes", () => {
    const directory = createDirectory({ "tailwind.css": `@import "tailwindcss";\n@layer components { .card { color: red; } }` });

    const read = () => {
      const asyncCtx = async(createContext(directory, "./tailwind.css"));
      return { components: getCustomComponentClasses(asyncCtx).customComponentClasses, prefix: getPrefix(asyncCtx).prefix };
    };

    expect(read()).toEqual({ components: ["card"], prefix: "" });
    expect(read()).toEqual({ components: ["card"], prefix: "" });
    expect(CachedStore.has("prefix")).toBe(true);
    expect(CachedStore.has("custom-component-classes")).toBe(true);

    changeFile(directory.files["tailwind.css"].path, `@import "tailwindcss" prefix(tw);\n@layer components { .panel { color: red; } }`);

    expect(read()).toEqual({ components: ["panel"], prefix: "tw" });
  });

  it("should invalidate host cached results when the worker rebuilds the context", () => {
    const directory = createDirectory({ "tailwind.css": `@import "tailwindcss";\n${utility("utility-a")}` });
    const asyncCtx = async(createContext(directory, "./tailwind.css"));

    getUnknownClasses(asyncCtx, classes);
    expect(isCached()).toBe(true);

    changeFile(directory.files["tailwind.css"].path, `@import "tailwindcss";\n${utility("utility-b")}`);

    // the host does not refresh the paths, only the worker notices the change and rebuilds the context
    getPrefix(asyncCtx);

    expect(isCached()).toBe(false);
  });

});
