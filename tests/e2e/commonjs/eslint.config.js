const eslintParserHTML = require("@html-eslint/parser");
const eslintPluginReadableTailwind = require("eslint-plugin-better-tailwindcss");


module.exports = {
  files: ["**/*.html"],
  languageOptions: {
    parser: eslintParserHTML
  },
  plugins: {
    "better-tailwindcss": eslintPluginReadableTailwind
  },
  rules: eslintPluginReadableTailwind.configs.warning.rules
};
