import { DEFAULT_ATTRIBUTE_NAMES, DEFAULT_CALLEE_NAMES, DEFAULT_VARIABLE_NAMES, DEFAULT_TAG_NAMES } from "better-tailwindcss:options/default-options.js";
import { isAttributesRegex, isCalleeRegex, isVariableRegex } from "better-tailwindcss:utils/matchers.js";
import type { Rule } from "eslint";



export function getCommonOptions(ctx: Rule.RuleContext) {

  const attributes = getOption(ctx, "attributes") ?? DEFAULT_ATTRIBUTE_NAMES;
  const callees = getOption(ctx, "callees") ?? DEFAULT_CALLEE_NAMES;
  const variables = getOption(ctx, "variables") ?? DEFAULT_VARIABLE_NAMES;
  const tags = getOption(ctx, "tags") ?? DEFAULT_TAG_NAMES;
  const tailwindConfig = getOption(ctx, "entryPoint") ?? getOption(ctx, "tailwindConfig");

  if (isAttributesRegex(attributes) || isCalleeRegex(callees) || isVariableRegex(variables)) {
    console.warn("⚠️ Warning: Regex matching is deprecated and will be removed in the next major version. Please use matchers instead.");
  }

  return {
    attributes,
    callees,
    tags,
    tailwindConfig,
    variables
  };
}
function getOption(ctx: Rule.RuleContext, key: string) {
  return ctx.options[0]?.[key] ?? ctx.settings["eslint-plugin-better-tailwindcss"]?.[key] ??
    ctx.settings["better-tailwindcss"]?.[key];
}
