import { validate } from "json-schema";
import { describe, expect, test } from "vitest";

import { getAttributesSchema, getCalleeSchema, getVariableSchema } from "readable-tailwind:options:descriptions.js";
import { MatcherType } from "readable-tailwind:types:rule.js";

import type { AttributeOption, CalleeOption, VariableOption } from "readable-tailwind:types:rule.js";


describe("descriptions", () => {

  test("name config", () => {

    const attributes = {
      attributes: [
        "class",
        "className"
      ]
    } satisfies AttributeOption;

    expect(
      validate(attributes, getAttributesSchema(attributes))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee"
      ]
    } satisfies CalleeOption;

    expect(
      validate(callees, getCalleeSchema(callees))
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
      validate(variable, getVariableSchema(variable))
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
      validate(attributes, getAttributesSchema(attributes))
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
      validate(callees, getCalleeSchema(callees))
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
      validate(variable, getVariableSchema(variable))
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
      validate(attributes, getAttributesSchema(attributes))
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
      validate(callees, getCalleeSchema(callees))
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
      validate(variable, getVariableSchema(variable))
    ).toStrictEqual(
      { errors: [], valid: true }
    );

  });

});
