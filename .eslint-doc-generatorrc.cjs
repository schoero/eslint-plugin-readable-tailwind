/** @type {import('eslint-doc-generator').GenerateOptions} */
const config = {
  "ignoreConfig": ["all"],
  "ignoreDeprecatedRules": true,
  "ruleListColumns": [
    "name",
    "description",
    "configsError",
    "configsWarn",
    "fixable",
  ],
  configEmoji: [
    ["warning", "![warning](https://github.com/schoero/eslint-plugin-readable-tailwind/assets/checkmark-warning.svg)"],
    ["error", "![error](https://github.com/schoero/eslint-plugin-readable-tailwind/assets/checkmark-error.svg)"],
  ],
  ruleDocSectionInclude: ["Description", "Examples"],
  ruleDocTitleFormat: "prefix-name",
}

module.exports = config;