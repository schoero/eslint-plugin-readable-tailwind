import type { Rule } from "eslint";
import type { Node as ESNode } from "estree";


export enum MatcherType {
  /** Matches all object keys that are strings. */
  ObjectKey = "objectKeys",
  /** Matches all object values that are strings. */
  ObjectValue = "objectValues",
  /** Matches all strings  that are not matched by another matcher. */
  String = "strings"
}

export type StringMatcher = {
  match: MatcherType.String;
};

export type ObjectKeyMatcher = {
  match: MatcherType.ObjectKey;
  pathPattern?: Regex;
};

export type ObjectValueMatcher = {
  match: MatcherType.ObjectValue;
  pathPattern?: Regex;
};

export type MatcherFunction = (node: ESNode) => boolean;
export type MatcherFunctions = MatcherFunction[];

export type Matcher = ObjectKeyMatcher | ObjectValueMatcher | StringMatcher;

export type Regex = string;

export type CalleeName = string;
export type CalleeMatchers = [callee: CalleeName, matchers: Matcher[]];
export type CalleeRegex = [containerRegex: Regex, literalRegex: Regex];
export type Callees = (CalleeMatchers | CalleeName | CalleeRegex)[];
export type CalleeOption = {
  callees: Callees;
};

export type VariableName = string;
export type VariableMatchers = [variable: VariableName, matchers: Matcher[]];
export type VariableRegex = [variableNameRegex: Regex, literalRegex: Regex];
export type Variables = (VariableMatchers | VariableName | VariableRegex)[];
export type VariableOption = {
  variables: Variables;
};

export type TagName = string;
export type TagMatchers = [tag: TagName, matchers: Matcher[]];
export type TagRegex = [tagRegex: Regex, literalRegex: Regex];
export type Tags = (TagMatchers | TagName | TagRegex)[];
export type TagOption = {
  tags: Tags;
};

export type ClassAttributeName = string;
export type ClassAttributeMatchers = [classAttribute: ClassAttributeName, matchers: Matcher[]];
export type ClassAttributeRegex = [classAttributeRegex: Regex, literalRegex: Regex];
export type ClassAttributes = (ClassAttributeMatchers | ClassAttributeName | ClassAttributeRegex)[];
export type ClassAttributeOption = {
  classAttributes: ClassAttributes;
};

export type NameConfig = CalleeName | ClassAttributeName | VariableName;
export type RegexConfig = CalleeRegex | ClassAttributeRegex | VariableRegex;
export type MatchersConfig = CalleeMatchers | ClassAttributeMatchers | VariableMatchers;

export interface ESLintRule<Options extends any[] = [any]> {
  name: string;
  rule: Rule.RuleModule;
  options?: Options;
  settings?: Rule.RuleContext["settings"];
}
