import eslintParserHTML from "@html-eslint/parser";
import eslintPluginReadableTailwind from "eslint-plugin-better-tailwindcss";


export default {
  files: ["**/*.html"],
  languageOptions: {
    parser: eslintParserHTML
  },
  plugins: {
    "better-tailwindcss": eslintPluginReadableTailwind
  },
  rules: {
    "better-tailwindcss/no-unregistered-classes": [
      "warn",
      {
        tailwindConfig: "./tailwind.config.ts"
      }
    ]
  }
};
