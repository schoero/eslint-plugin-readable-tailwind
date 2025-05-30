import { CC } from "better-tailwindcss:options:callees/cc.js";
import { CLB } from "better-tailwindcss:options:callees/clb.js";
import { CLSX } from "better-tailwindcss:options:callees/clsx.js";
import { CN } from "better-tailwindcss:options:callees/cn.js";
import { CNB } from "better-tailwindcss:options:callees/cnb.js";
import { CTL } from "better-tailwindcss:options:callees/ctl.js";
import { CVA } from "better-tailwindcss:options:callees/cva.js";
import { CX } from "better-tailwindcss:options:callees/cx.js";
import { DCNB } from "better-tailwindcss:options:callees/dcnb.js";
import { OBJSTR } from "better-tailwindcss:options:callees/objstr.js";
import { TV } from "better-tailwindcss:options:callees/tv.js";
import { TW_JOIN } from "better-tailwindcss:options:callees/twJoin.js";
import { TW_MERGE } from "better-tailwindcss:options:callees/twMerge.js";
import { MatcherType } from "better-tailwindcss:types:rule.js";

import type { Attributes, Callees, Tags, Variables } from "better-tailwindcss:types:rule.js";


export const DEFAULT_CALLEE_NAMES = [
  ...CC,
  ...CLB,
  ...CLSX,
  ...CN,
  ...CNB,
  ...CTL,
  ...CVA,
  ...CX,
  ...DCNB,
  ...OBJSTR,
  ...TV,
  ...TW_JOIN,
  ...TW_MERGE
] satisfies Callees;

export const DEFAULT_ATTRIBUTE_NAMES = [
  // general
  "^class(?:Name)?$",
  [
    "^class(?:Name)?$", [
      {
        match: MatcherType.String
      }
    ]
  ],

  // angular
  "(?:^\\[class\\]$)|(?:^\\[ngClass\\]$)",
  [
    "(?:^\\[class\\]$)|(?:^\\[ngClass\\]$)", [
      {
        match: MatcherType.String
      },
      {
        match: MatcherType.ObjectKey
      }
    ]
  ],

  // vue
  [
    "^v-bind:class$", [
      {
        match: MatcherType.String
      },
      {
        match: MatcherType.ObjectKey
      }
    ]
  ],

  // astro
  [
    "^class:list$", [
      {
        match: MatcherType.String
      },
      {
        match: MatcherType.ObjectKey
      }
    ]
  ]
] satisfies Attributes;

export const DEFAULT_VARIABLE_NAMES = [
  [
    "^classNames?$", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "^classes$", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "^styles?$", [
      {
        match: MatcherType.String
      }
    ]
  ]
] satisfies Variables;

export const DEFAULT_TAG_NAMES = [] satisfies Tags;
