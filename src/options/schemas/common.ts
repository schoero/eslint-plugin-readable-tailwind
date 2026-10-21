import { env } from "node:process";

import {
  boolean,
  description,
  literal,
  minValue,
  number,
  optional,
  pipe,
  strictObject,
  string,
  union
} from "valibot";

import type { InferOutput } from "valibot";


export const ENTRYPOINT_OPTION_SCHEMA = strictObject({
  entryPoint: optional(
    pipe(
      string(),
      description("The path to the css entry point of the project. If not specified, the plugin will fall back to the default tailwind classes.")
    ),
    undefined
  )
});

export type EntryPointOption = InferOutput<typeof ENTRYPOINT_OPTION_SCHEMA>;

export const TAILWIND_OPTION_SCHEMA = strictObject({
  tailwindConfig: optional(
    pipe(
      string(),
      description("The path to the tailwind config file. If not specified, the plugin will try to find it automatically or falls back to the default configuration.")
    ),
    undefined
  )
});

export type TailwindConfigOption = InferOutput<typeof TAILWIND_OPTION_SCHEMA>;

export const TSCONFIG_OPTION_SCHEMA = strictObject({
  tsconfig: optional(
    pipe(
      string(),
      description("The path to the tsconfig file. Is used to resolve path aliases in the tsconfig.")
    ),
    undefined
  )
});

export type TSConfigOption = InferOutput<typeof TSCONFIG_OPTION_SCHEMA>;

export const MESSAGE_STYLE_OPTION_SCHEMA = strictObject({
  messageStyle: optional(
    pipe(
      union([
        literal("visual"),
        literal("compact"),
        literal("raw")
      ]),
      description("How linting messages are displayed.")
    ),
    env.CI === "true" || env.CI === "1"
      ? "compact"
      : "visual"
  )
});

export type MessageStyleOption = InferOutput<typeof MESSAGE_STYLE_OPTION_SCHEMA>;

export const DETECT_COMPONENT_CLASSES_OPTION_SCHEMA = strictObject({
  detectComponentClasses: optional(
    pipe(
      boolean(),
      description("Whether to automatically detect custom component classes from the tailwindcss config.")
    ),
    false
  )
});

export type DetectComponentClassesOption = InferOutput<typeof DETECT_COMPONENT_CLASSES_OPTION_SCHEMA>;

export const ROOT_FONT_SIZE_OPTION_SCHEMA = strictObject({
  rootFontSize: optional(
    pipe(
      number(),
      description("The root font size in pixels.")
    ),
    undefined
  )
});

export type RootFontSizeOption = InferOutput<typeof ROOT_FONT_SIZE_OPTION_SCHEMA>;

export const CWD_OPTION_SCHEMA = strictObject({
  cwd: optional(
    pipe(
      string(),
      description("The working directory to resolve tailwindcss and the config from. Useful in monorepo setups.")
    ),
    undefined
  )
});

export type CwdOption = InferOutput<typeof CWD_OPTION_SCHEMA>;

export const CACHE_SIZE_OPTION_SCHEMA = strictObject({
  cacheSize: optional(
    pipe(
      number(),
      minValue(1),
      description("The maximum memory in megabytes the cache may use. The least recently used entries are evicted beyond that.")
    ),
    32
  )
});

export type CacheSizeOption = InferOutput<typeof CACHE_SIZE_OPTION_SCHEMA>;
