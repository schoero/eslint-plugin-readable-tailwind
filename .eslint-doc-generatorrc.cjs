/** @type {import('eslint-doc-generator').GenerateOptions} */
const config = {
  configEmoji: [
    ["warning", "![warning](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-warning.svg)"],
    ["error", "![error](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-error.svg)"]
  ],
  ignoreConfig: ["all"],
  ignoreDeprecatedRules: true,
  ruleDocSectionInclude: ["Description", "Examples"],
  ruleDocTitleFormat: "prefix-name",
  ruleListColumns: [
    "name",
    "description",
    "configsError",
    "configsWarn",
    "fixable"
  ]
};

module.exports = config;
