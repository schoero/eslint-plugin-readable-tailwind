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
    ["warning", "✅"],
    ["error", "✅"],
  ],
  ruleDocSectionInclude: ["Description", "Examples"],
  ruleDocTitleFormat: "prefix-name",
}

module.exports = config;