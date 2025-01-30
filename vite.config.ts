import { config } from "@schoero/configs/vite";

import type { UserConfig } from "vitest/node";


export default {
  ...config,
  testTimeout: 10_000
} satisfies UserConfig;
