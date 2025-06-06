import {
  DEFAULT_ATTRIBUTE_NAMES,
  DEFAULT_CALLEE_NAMES,
  DEFAULT_TAG_NAMES,
  DEFAULT_VARIABLE_NAMES
} from "better-tailwindcss:options/default-options.js";
import { DEFAULT_IGNORED_UNREGISTERED_CLASSES } from "better-tailwindcss:rules/no-unregistered-classes.js";


export function getDefaultCallees() {
  return DEFAULT_CALLEE_NAMES;
}

export function getDefaultAttributes() {
  return DEFAULT_ATTRIBUTE_NAMES;
}

export function getDefaultVariables() {
  return DEFAULT_VARIABLE_NAMES;
}

export function getDefaultTags() {
  return DEFAULT_TAG_NAMES;
}

export function getDefaultIgnoredUnregisteredClasses() {
  return DEFAULT_IGNORED_UNREGISTERED_CLASSES;
}
