import eslintParserHTML from "@html-eslint/parser";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";


export default {
  files: ["**/*.html"],
  languageOptions: {
    parser: eslintParserHTML
  },
  plugins: {
    "better-tailwindcss": eslintPluginBetterTailwindcss
  },
  rules: eslintPluginBetterTailwindcss.configs["all-warn"].rules
};
