const eslintParserHTML = require("@html-eslint/parser");
const eslintPluginReadableTailwind = require("eslint-plugin-readable-tailwind");


module.exports = {
  files: ["**/*.html"],
  languageOptions: {
    parser: eslintParserHTML
  },
  plugins: {
    "readable-tailwind": eslintPluginReadableTailwind
  },
  rules: eslintPluginReadableTailwind.configs.warning.rules
};
