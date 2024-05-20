import { deepEqual } from "node:assert";
import { describe, test } from "node:test";

import { validate } from "json-schema";

import { getCalleeSchema, getClassAttributeSchema, getVariableSchema } from "readable-tailwind:config:descriptions.js";
import { MatcherType } from "readable-tailwind:types:rule.js";

import type { CalleeOption, ClassAttributeOption, VariableOption } from "readable-tailwind:types:rule.js";


describe("descriptions", () => {

  test("name config", () => {

    const classAttributes = {
      classAttributes: [
        "class",
        "className"
      ]
    } satisfies ClassAttributeOption;

    deepEqual(
      validate(classAttributes, getClassAttributeSchema(classAttributes)),
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee"
      ]
    } satisfies CalleeOption;

    deepEqual(
      validate(callees, getCalleeSchema(callees)),
      { errors: [], valid: true }
    );

    const variable = {
      variables: [
        "classes",
        "styles"
      ]
    } satisfies VariableOption;

    deepEqual(
      validate(variable, getVariableSchema(variable)),
      { errors: [], valid: true }
    );

  });

  test("regex config", () => {

    const classAttributes = {
      classAttributes: [
        "(class|className)",
        "(.*)"
      ]
    } satisfies ClassAttributeOption;

    deepEqual(
      validate(classAttributes, getClassAttributeSchema(classAttributes)),
      { errors: [], valid: true }
    );

    const callees = {
      callees: [
        "callee(.*)",
        "(.*)"
      ]
    } satisfies CalleeOption;

    deepEqual(
      validate(callees, getCalleeSchema(callees)),
      { errors: [], valid: true }
    );

    const variable = {
      variables: [
        "variable = (.*)",
        "(.*)"
      ]
    } satisfies VariableOption;

    deepEqual(
      validate(variable, getVariableSchema(variable)),
      { errors: [], valid: true }
    );

  });

  test("matcher config", () => {

    const classAttributes: ClassAttributeOption = {
      classAttributes: [
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

    deepEqual(
      validate(classAttributes, getClassAttributeSchema(classAttributes)),
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

    deepEqual(
      validate(callees, getCalleeSchema(callees)),
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

    deepEqual(
      validate(variable, getVariableSchema(variable)),
      { errors: [], valid: true }
    );

  });

});
