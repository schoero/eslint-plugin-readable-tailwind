import { HTML } from "better-tailwindcss:options/frameworks/html.js";
import { REACT } from "better-tailwindcss:options/frameworks/react.js";

import type { Selectors } from "better-tailwindcss:types/rule.js";


/** @see https://preactjs.com/guide/v10/differences-to-react/#raw-html-attributeproperty-names */
export const PREACT = [
  ...HTML,
  ...REACT
] satisfies Selectors;
