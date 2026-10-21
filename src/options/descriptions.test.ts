import { toJsonSchema } from "@valibot/to-json-schema";
import { validate } from "json-schema";
import { parse } from "valibot";
import { describe, expect, test } from "vitest";

import { COMMON_OPTIONS } from "better-tailwindcss:options/descriptions.js";
import { ATTRIBUTES_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/attributes.js";
import { CALLEES_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/callees.js";
import { VARIABLES_OPTION_SCHEMA } from "better-tailwindcss:options/schemas/variables.js";
import { MatcherType } from "better-tailwindcss:types/rule.js";

import type { AttributesOptions } from "better-tailwindcss:options/schemas/attributes.js";
import type { CalleesOptions } from "better-tailwindcss:options/schemas/callees.js";
import type { VariablesOptions } from "better-tailwindcss:options/schemas/variables.js";


describe("descriptions", () => {

  test("name config", () => {

    const attributes = {
      attributes: [
        "class",
        "className"
      ]
    } satisfies AttributesOptions;

    expect(
      validate(attributes, toJsonSchema(ATTRIBUTES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee"
      ]
    } satisfies CalleesOptions;

    expect(
      validate(callees, toJsonSchema(CALLEES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const variable = {
      variables: [
        "classes",
        "styles"
      ]
    } satisfies VariablesOptions;

    expect(
      validate(variable, toJsonSchema(VARIABLES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("regex config", () => {

    const attributes = {
      attributes: [
        "(class|className)",
        "(.*)"
      ]
    } satisfies AttributesOptions;

    expect(
      validate(attributes, toJsonSchema(ATTRIBUTES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee(.*)",
        "(.*)"
      ]
    } satisfies CalleesOptions;

    expect(
      validate(callees, toJsonSchema(CALLEES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const variable = {
      variables: [
        "variable = (.*)",
        "(.*)"
      ]
    } satisfies VariablesOptions;

    expect(
      validate(variable, toJsonSchema(VARIABLES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("matcher config", () => {

    const attributes: AttributesOptions = {
      attributes: [
        [
          "class",
          [
            {
              match: MatcherType.String
            },
            {
              match: MatcherType.ObjectKey,
              pathPattern: "^.*"
            },
            {
              match: MatcherType.ObjectValue
            }
          ]
        ]
      ]
    };

    expect(
      validate(attributes, toJsonSchema(ATTRIBUTES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees: CalleesOptions = {
      callees: [
        [
          "callee",
          [
            {
              match: MatcherType.String
            },
            {
              match: MatcherType.ObjectKey,
              pathPattern: "^.*"
            },
            {
              match: MatcherType.ObjectValue
            }
          ]
        ]
      ]
    };

    expect(
      validate(callees, toJsonSchema(CALLEES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const variable: VariablesOptions = {
      variables: [
        [
          "variable",
          [
            {
              match: MatcherType.String
            },
            {
              match: MatcherType.ObjectKey,
              pathPattern: "^.*"
            },
            {
              match: MatcherType.ObjectValue
            }
          ]
        ]
      ]
    };

    expect(
      validate(variable, toJsonSchema(VARIABLES_OPTION_SCHEMA))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("selectors config", () => {

    const selectors = {
      selectors: [
        {
          callTarget: -1,
          kind: "callee",
          match: [
            {
              type: MatcherType.String
            }
          ],
          path: "^classes\\.push$"
        },
        {
          kind: "tag",
          name: "^tw$"
        },
        {
          kind: "attribute",
          match: [
            {
              pathPattern: "^compoundVariants\\[\\d+\\]\\.(?:className|class)$",
              type: MatcherType.ObjectValue
            }
          ],
          name: "^class(?:Name)?$"
        }
      ]
    };

    expect(
      validate(selectors, toJsonSchema(COMMON_OPTIONS))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("selectors targetCall and targetArgument config", () => {

    const selectors = {
      selectors: [
        {
          kind: "callee",
          name: "^cn$",
          targetArgument: "first",
          targetCall: "last"
        },
        {
          callTarget: -1,
          kind: "callee",
          name: "^legacy$",
          targetArgument: 0
        }
      ]
    };

    expect(
      validate(selectors, toJsonSchema(COMMON_OPTIONS))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("selectors anonymousFunctionReturn matcher config", () => {

    const selectors = {
      selectors: [
        {
          kind: "callee",
          match: [{
            match: [
              { type: MatcherType.String },
              { type: MatcherType.ObjectKey },
              { path: "^compoundVariants\\[\\d+\\]\\.(?:className|class)$", type: MatcherType.ObjectValue }
            ],
            type: MatcherType.AnonymousFunctionReturn
          }],
          name: "^classFactory$"
        }
      ]
    };

    expect(
      validate(selectors, toJsonSchema(COMMON_OPTIONS))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("cache size", () => {
    expect(parse(COMMON_OPTIONS, {}).cacheSize).toBe(32);
    expect(parse(COMMON_OPTIONS, { cacheSize: 8 }).cacheSize).toBe(8);
    expect(() => parse(COMMON_OPTIONS, { cacheSize: 0 })).toThrow();
    expect(validate({ cacheSize: 64 }, toJsonSchema(COMMON_OPTIONS)).valid).toBe(true);
    expect(validate({ cacheSize: "64" }, toJsonSchema(COMMON_OPTIONS)).valid).toBe(false);
  });

});
