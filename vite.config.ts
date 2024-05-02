import dts from "vite-plugin-dts";
import noBundlePlugin from "vite-plugin-no-bundle";

import { config, defineConfig } from "@schoero/configs/vite";

import type { UserConfig } from "vite";


export default defineConfig(<UserConfig>{
  ...config,
  build: {
    emptyOutDir: true,
    lib: {
      entry: [
        "./src/index.ts",
        "./src/utils/tailwind-v3.ts",
        "./src/utils/tailwind-v4.ts"
      ],
      formats: ["es", "cjs"]
    },
    minify: false,
    outDir: "lib/",
    target: "ES2020"
  },
  plugins: [
    ...config.plugins ?? [],
    noBundlePlugin(),
    dts({
      entryRoot: "./src",
      exclude: ["src/**/*.test.ts", "test/**"],
      pathsToAliases: true,
      strictOutput: true
    })
  ],
  resolve: {
    alias: [
      {
        find: "tailwindcss3",
        replacement: "tailwindcss"
      },
      {
        find: "tailwindcss4",
        replacement: "tailwindcss"
      }
    ]
  }
});
