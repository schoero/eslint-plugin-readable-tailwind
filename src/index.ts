import { jsxAttributeExpression } from "eptm:rules:jsx-attribute-expression.js";

import type { ESLint } from "eslint";


export default {
  rules: {
    [jsxAttributeExpression.name]: jsxAttributeExpression.rule
  }
} satisfies ESLint.Plugin;
