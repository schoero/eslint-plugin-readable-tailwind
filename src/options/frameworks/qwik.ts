import { HTML } from "better-tailwindcss:options/frameworks/html.js";

import type { Selectors } from "better-tailwindcss:types/rule.js";


/** @see https://qwik.dev/docs/components/rendering/#class-and-style-bindings */
export const QWIK = [
  ...HTML
] satisfies Selectors;
