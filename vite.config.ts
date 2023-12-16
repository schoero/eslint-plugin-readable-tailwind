import dts from "vite-plugin-dts";
import noBundlePlugin from "vite-plugin-no-bundle";

import { config, defineConfig } from "@schoero/vite-config";

import type { UserConfig } from "vitest";


export default defineConfig(<UserConfig>{
  ...config,
  build: {
    emptyOutDir: true,
    lib: {
      entry: ["./src/index.ts"],
      formats: ["es", "cjs"]
    },
    minify: false,
    outDir: "lib/",
    rollupOptions: {
      external: [
        /node_modules/,
        /tailwindcss/,
        /^node:.*/
      ]
    },
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
  ]
});
