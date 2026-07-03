import { MatcherType, SelectorKind } from "better-tailwindcss:types/rule.js";

import type { Attributes } from "better-tailwindcss:options/schemas/attributes.js";
import type { Callees } from "better-tailwindcss:options/schemas/callees.js";
import type { Tags } from "better-tailwindcss:options/schemas/tags.js";
import type { Variables } from "better-tailwindcss:options/schemas/variables.js";
import type { Matcher, Selector, SelectorMatcher, Selectors } from "better-tailwindcss:types/rule.js";


type LegacySelector = Attributes[number] | Callees[number] | Tags[number] | Variables[number];

type LegacySelectorsByKind = {
  attributes?: Attributes | undefined;
  callees?: Callees | undefined;
  tags?: Tags | undefined;
  variables?: Variables | undefined;
};

export function migrateLegacySelectorsToFlatSelectors(legacy: LegacySelectorsByKind): Selectors {
  const selectors: Selectors = [];

  if(legacy.attributes){
    for(const attributeSelector of legacy.attributes){
      selectors.push(migrateLegacySelector(attributeSelector, SelectorKind.Attribute));
    }
  }
  if(legacy.callees){
    for(const calleeSelector of legacy.callees){
      selectors.push(migrateLegacySelector(calleeSelector, SelectorKind.Callee));
    }
  }
  if(legacy.tags){
    for(const tagSelector of legacy.tags){
      selectors.push(migrateLegacySelector(tagSelector, SelectorKind.Tag));
    }
  }
  if(legacy.variables){
    for(const variableSelector of legacy.variables){
      selectors.push(migrateLegacySelector(variableSelector, SelectorKind.Variable));
    }
  }

  return selectors;
}

export function migrateFlatSelectorsToLegacySelectors(selectors: Selectors): LegacySelectorsByKind {
  return selectors.reduce<LegacySelectorsByKind>((legacy, selector) => {
    const migratedSelector = migrateFlatSelector(selector);

    if(migratedSelector === undefined){
      return legacy;
    }

    switch (selector.kind){
      case SelectorKind.Attribute:
        (legacy.attributes ??= []).push(migratedSelector);
        break;
      case SelectorKind.Callee:
        (legacy.callees ??= []).push(migratedSelector);
        break;
      case SelectorKind.Tag:
        (legacy.tags ??= []).push(migratedSelector);
        break;
      case SelectorKind.Variable:
        (legacy.variables ??= []).push(migratedSelector);
        break;
    }

    return legacy;
  }, {});
}

export function hasLegacySelectorConfig(options: LegacySelectorsByKind): boolean {
  return (
    options.attributes !== undefined ||
    options.callees !== undefined ||
    options.tags !== undefined ||
    options.variables !== undefined
  );
}

function toSelectorMatcher(matcher: Matcher): SelectorMatcher {
  if(matcher.match === MatcherType.String){
    return {
      type: matcher.match
    };
  }

  return {
    ...matcher.pathPattern !== undefined && {
      path: matcher.pathPattern
    },
    type: matcher.match
  };
}

function toLegacyMatcher(matcher: SelectorMatcher): Matcher | undefined {
  if(matcher.type === MatcherType.AnonymousFunctionReturn){
    return;
  }

  if(matcher.type === MatcherType.String){
    return {
      match: matcher.type
    };
  }

  return {
    ...matcher.path !== undefined && {
      pathPattern: matcher.path
    },
    match: matcher.type
  };
}

function migrateLegacySelector(selector: LegacySelector, kind: SelectorKind): Selector {
  const name = typeof selector === "string" ? selector : selector[0];
  const path = kind === SelectorKind.Callee || kind === SelectorKind.Tag ? name : undefined;
  const matchers = typeof selector === "string" ? undefined : selector[1].map(toSelectorMatcher);

  if(matchers === undefined){
    return {
      kind,
      name,
      ...path ? { path } : {}
    } as Selector;
  }

  return {
    kind,
    match: matchers,
    name,
    ...path ? { path } : {}
  } as Selector;
}

function migrateFlatSelector(selector: Selector): LegacySelector | undefined {
  if(selector.kind === SelectorKind.Style){
    return;
  }

  if(selector.kind === SelectorKind.Callee || selector.kind === SelectorKind.Tag){
    if(selector.match === undefined){
      return selector.name ?? selector.path!;
    }

    const legacyMatchers = selector.match
      .map(toLegacyMatcher)
      .filter((matcher): matcher is Matcher => matcher !== undefined);

    if(legacyMatchers.length !== selector.match.length){
      return;
    }

    return [
      selector.name ?? selector.path!,
      legacyMatchers
    ];
  }

  if(selector.match === undefined){
    return selector.name;
  }

  const legacyMatchers = selector.match
    .map(toLegacyMatcher)
    .filter((matcher): matcher is Matcher => matcher !== undefined);

  if(legacyMatchers.length !== selector.match.length){
    return;
  }

  return [
    selector.name,
    legacyMatchers
  ];
}
