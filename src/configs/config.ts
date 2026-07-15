import { enforceCanonicalClasses } from "better-tailwindcss:rules/enforce-canonical-classes.js";
import { enforceConsistentClassOrder } from "better-tailwindcss:rules/enforce-consistent-class-order.js";
import { enforceConsistentImportantPosition } from "better-tailwindcss:rules/enforce-consistent-important-position.js";
import { enforceConsistentLineWrapping } from "better-tailwindcss:rules/enforce-consistent-line-wrapping.js";
import { enforceConsistentVariableSyntax } from "better-tailwindcss:rules/enforce-consistent-variable-syntax.js";
import { enforceConsistentVariantOrder } from "better-tailwindcss:rules/enforce-consistent-variant-order.js";
import { enforceLogicalProperties } from "better-tailwindcss:rules/enforce-logical-properties.js";
import { enforceMotionSafeVariant } from "better-tailwindcss:rules/enforce-motion-safe-variant.js";
import { enforceShorthandClasses } from "better-tailwindcss:rules/enforce-shorthand-classes.js";
import { noConflictingClasses } from "better-tailwindcss:rules/no-conflicting-classes.js";
import { noDeprecatedClasses } from "better-tailwindcss:rules/no-deprecated-classes.js";
import { noDuplicateClasses } from "better-tailwindcss:rules/no-duplicate-classes.js";
import { noRestrictedClasses } from "better-tailwindcss:rules/no-restricted-classes.js";
import { noUnknownClasses } from "better-tailwindcss:rules/no-unknown-classes.js";
import { noUnnecessaryWhitespace } from "better-tailwindcss:rules/no-unnecessary-whitespace.js";

import type { ESLint, Linter } from "eslint";

import type { RuleCategory } from "better-tailwindcss:types/rule.js";


type ConfigName = "recommended" | RuleCategory;
type Severity = "error" | "warn";

type PluginRules = typeof rules[number];

type PluginName = typeof plugin.meta.name;

type RuleObject = {
  [Rule in PluginRules as Rule extends any ? Rule["name"] : never]: Rule["rule"]
};

type GetRules<Category extends RuleCategory> = Extract<
  PluginRules,
  { category: Category; recommended: true; }
>;

const rules = [
  enforceConsistentClassOrder,
  enforceConsistentImportantPosition,
  enforceConsistentLineWrapping,
  enforceConsistentVariantOrder,
  enforceConsistentVariableSyntax,
  enforceLogicalProperties,
  enforceMotionSafeVariant,
  enforceShorthandClasses,
  noConflictingClasses,
  noDeprecatedClasses,
  noDuplicateClasses,
  noRestrictedClasses,
  noUnnecessaryWhitespace,
  noUnknownClasses,
  enforceCanonicalClasses
] as const;

const plugin = {
  meta: {
    name: "better-tailwindcss"
  },
  // eslint-disable-next-line eslint-plugin-typescript/no-unnecessary-type-assertion
  rules: rules.reduce(
    (acc, { name, rule }) => {
      acc[name] = rule;
      return acc;
    },
    {}
  ) as RuleObject
} as const satisfies ESLint.Plugin;

const getStylisticRules = <SeverityLevel extends Severity = "warn">(severity: SeverityLevel = "warn" as SeverityLevel) => {
  return rules.reduce((acc, { category, name, recommended }) => {
    if(category !== "stylistic" || !recommended){
      return acc;
    }

    acc[`${plugin.meta.name}/${name}`] = severity;
    return acc;
  }, {} as Record<`${PluginName}/${GetRules<"stylistic">["name"]}`, SeverityLevel>);
};

const getCorrectnessRules = <SeverityLevel extends Severity = "error">(severity: SeverityLevel = "error" as SeverityLevel) => {
  return rules.reduce((acc, { category, name, recommended }) => {
    if(category !== "correctness" || !recommended){
      return acc;
    }

    acc[`${plugin.meta.name}/${name}`] = severity;
    return acc;
  }, {} as Record<`${PluginName}/${GetRules<"correctness">["name"]}`, SeverityLevel>);
};

const getRecommendedRules = <SeverityLevel extends Severity>(severity?: SeverityLevel) => ({
  ...getStylisticRules(severity),
  ...getCorrectnessRules(severity)
});

const createLegacyConfig = <Rules extends Linter.RulesRecord>(rules: Rules) => ({
  plugins: [plugin.meta.name],
  rules
} satisfies Linter.LegacyConfig<Rules>);

const createFlatConfig = <Rules extends Linter.RulesRecord>(rules: Rules) => ({
  plugins: {
    [plugin.meta.name]: plugin
  },
  rules
} satisfies Linter.Config<Rules>);

const configEntry = <ConfigName extends string, Config>(key: ConfigName, value: Config) => {
  return { [key]: value } as { [Name in ConfigName]: Config };
};

const createConfig = <Name extends ConfigName, RuleName extends string>(name: Name, getRules: <SeverityLevel extends Severity>(severity?: SeverityLevel) => Record<RuleName, SeverityLevel>) => {
  return {
    ...configEntry(`legacy-${name}` as const, createLegacyConfig(getRules())),
    ...configEntry(
      `legacy-${name}-error` as const,
      createLegacyConfig(getRules("error"))
    ),
    ...configEntry(
      `legacy-${name}-warn` as const,
      createLegacyConfig(getRules("warn"))
    ),
    ...configEntry(name, createFlatConfig(getRules())),
    ...configEntry(
      `${name}-error` as const,
      createFlatConfig(getRules("error"))
    ),
    ...configEntry(`${name}-warn` as const, createFlatConfig(getRules("warn")))
  };
};

const config = {
  ...plugin,

  configs: {
    ...createConfig("stylistic", getStylisticRules),
    ...createConfig("correctness", getCorrectnessRules),
    ...createConfig("recommended", getRecommendedRules)
  }
} satisfies ESLint.Plugin;

export default config;

export { config as "module.exports" };
