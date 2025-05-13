const eslintParserHTML = require("@html-eslint/parser");
const eslintPluginBetterTailwindcss = require("eslint-plugin-better-tailwindcss");


module.exports = {
  files: ["**/*.html"],
  languageOptions: {
    parser: eslintParserHTML
  },
  plugins: {
    "better-tailwindcss": eslintPluginBetterTailwindcss
  },
  rules: eslintPluginBetterTailwindcss.configs.warning.rules
};
