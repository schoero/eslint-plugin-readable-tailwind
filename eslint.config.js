import sharedConfig from "@schoero/configs/eslint";


export default [
  ...sharedConfig,
  {
    files: ["**/*.test.{js,jsx,cjs,mjs,ts,tsx}", "**/*.test-d.{ts,tsx}"],
    rules: {
      "eslint-plugin-stylistic-ts/quotes": ["warn", "double", { allowTemplateLiterals: true, avoidEscape: true }],
      "eslint-plugin-typescript/no-unnecessary-condition": "off",
      "eslint-plugin-typescript/no-useless-template-literals": "off",
      "eslint-plugin-vitest/expect-expect": "off"
    }
  }
];
