import { CC } from "readable-tailwind:options:callees/cc.js";
import { CLB } from "readable-tailwind:options:callees/clb.js";
import { CLSX } from "readable-tailwind:options:callees/clsx.js";
import { CN } from "readable-tailwind:options:callees/cn.js";
import { CNB } from "readable-tailwind:options:callees/cnb.js";
import { CTL } from "readable-tailwind:options:callees/ctl.js";
import { CVA } from "readable-tailwind:options:callees/cva.js";
import { CX } from "readable-tailwind:options:callees/cx.js";
import { DCNB } from "readable-tailwind:options:callees/dcnb.js";
import { OBJSTR } from "readable-tailwind:options:callees/objstr.js";
import { TV } from "readable-tailwind:options:callees/tv.js";
import { TW_JOIN } from "readable-tailwind:options:callees/twJoin.js";
import { TW_MERGE } from "readable-tailwind:options:callees/twMerge.js";
import { MatcherType } from "readable-tailwind:types:rule.js";

import type { Attributes, Callees, Tags, Variables } from "readable-tailwind:types:rule.js";


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
