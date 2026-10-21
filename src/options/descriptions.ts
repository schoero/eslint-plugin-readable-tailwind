import { strictObject } from "valibot";

import { ATTRIBUTES_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/attributes.js";
import { CALLEES_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/callees.js";
import {
  CACHE_SIZE_OPTION_SCHEMA,
  CWD_OPTION_SCHEMA,
  DETECT_COMPONENT_CLASSES_OPTION_SCHEMA,
  ENTRYPOINT_OPTION_SCHEMA,
  MESSAGE_STYLE_OPTION_SCHEMA,
  ROOT_FONT_SIZE_OPTION_SCHEMA,
  TAILWIND_OPTION_SCHEMA,
  TSCONFIG_OPTION_SCHEMA
} from "better-tailwindcss:options/schemas/common.js";
import { SELECTORS_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/selectors.js";
import { TAGS_OPTIONS_SCHEMA } from "better-tailwindcss:options/schemas/tags.js";
import { VARIABLES_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/variables.js";

import type { InferInput, InferOutput } from "valibot";


export const COMMON_OPTIONS = strictObject({
  ...SELECTORS_OPTION_SCHEMA.entries,
  ...CALLEES_OPTION_SCHEMA.entries,
  ...ATTRIBUTES_OPTION_SCHEMA.entries,
  ...VARIABLES_OPTION_SCHEMA.entries,
  ...TAGS_OPTIONS_SCHEMA.entries,
  ...ENTRYPOINT_OPTION_SCHEMA.entries,
  ...MESSAGE_STYLE_OPTION_SCHEMA.entries,
  ...TAILWIND_OPTION_SCHEMA.entries,
  ...TSCONFIG_OPTION_SCHEMA.entries,
  ...DETECT_COMPONENT_CLASSES_OPTION_SCHEMA.entries,
  ...ROOT_FONT_SIZE_OPTION_SCHEMA.entries,
  ...CWD_OPTION_SCHEMA.entries,
  ...CACHE_SIZE_OPTION_SCHEMA.entries
});

export type CommonOptions = InferOutput<typeof COMMON_OPTIONS>;

/** User-provided settings before default values are applied. */
export type Settings = InferInput<typeof COMMON_OPTIONS>;
