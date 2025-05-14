import { validate } from "json-schema";
import { describe, expect, test } from "vitest";

import { ATTRIBUTE_SCHEMA, CALLEE_SCHEMA, VARIABLE_SCHEMA } from "better-tailwindcss:options:descriptions.js";
import { MatcherType } from "better-tailwindcss:types:rule.js";

import type { AttributeOption, CalleeOption, VariableOption } from "better-tailwindcss:types:rule.js";


describe("descriptions", () => {

  test("name config", () => {

    const attributes = {
      attributes: [
        "class",
        "className"
      ]
    } satisfies AttributeOption;

    expect(
      validate(attributes, ATTRIBUTE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee"
      ]
    } satisfies CalleeOption;

    expect(
      validate(callees, CALLEE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const variable = {
      variables: [
        "classes",
        "styles"
      ]
    } satisfies VariableOption;

    expect(
      validate(variable, VARIABLE_SCHEMA)
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
    } satisfies AttributeOption;

    expect(
      validate(attributes, ATTRIBUTE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee(.*)",
        "(.*)"
      ]
    } satisfies CalleeOption;

    expect(
      validate(callees, CALLEE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const variable = {
      variables: [
        "variable = (.*)",
        "(.*)"
      ]
    } satisfies VariableOption;

    expect(
      validate(variable, VARIABLE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

  test("matcher config", () => {

    const attributes: AttributeOption = {
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
      validate(attributes, ATTRIBUTE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees: CalleeOption = {
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
      validate(callees, CALLEE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const variable: VariableOption = {
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
      validate(variable, VARIABLE_SCHEMA)
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

});
