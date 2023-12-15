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
    "options"
  ],
  ruleDocSectionInclude: ['Examples'],
  ruleDocTitleFormat: 'prefix-name',
  ruleListSplit: 'meta.docs.category',
}

module.exports = config;