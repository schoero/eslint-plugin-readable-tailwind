import eslintParserHTML from "@html-eslint/parser";
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";


export default {
  files: ["**/*.html"],
  languageOptions: {
    parser: eslintParserHTML
  },
  plugins: {
    "readable-tailwind": eslintPluginReadableTailwind
  },
  rules: {
    "readable-tailwind/no-unregistered-classes": [
      "warn",
      {
        tailwindConfig: "./tailwind.config.ts"
      }
    ]
  }
};
