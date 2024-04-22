import { CC } from "readable-tailwind:config:callees/cc.js";
import { CLB } from "readable-tailwind:config:callees/clb.js";
import { CLSX } from "readable-tailwind:config:callees/clsx.js";
import { CN } from "readable-tailwind:config:callees/cn.js";
import { CNB } from "readable-tailwind:config:callees/cnb.js";
import { CTL } from "readable-tailwind:config:callees/ctl.js";
import { CVA } from "readable-tailwind:config:callees/cva.js";
import { CX } from "readable-tailwind:config:callees/cx.js";
import { DCNB } from "readable-tailwind:config:callees/dcnb.js";
import { OBJSTR } from "readable-tailwind:config:callees/objstr.js";
import { TV } from "readable-tailwind:config:callees/tv.js";
import { TW_JOIN } from "readable-tailwind:config:callees/twJoin.js";
import { TW_MERGE } from "readable-tailwind:config:callees/twMerge.js";
import { MatcherType } from "readable-tailwind:types:rule.js";

import type { Callees, ClassAttributes, Variables } from "readable-tailwind:types:rule.js";


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

export const DEFAULT_CLASS_ATTRIBUTES = [
  [
    "class", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "className", [
      {
        match: MatcherType.String
      }
    ]
  ]
] satisfies ClassAttributes;

export const DEFAULT_VARIABLE_NAMES = [
  [
    "className", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "classNames", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "classes", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "style", [
      {
        match: MatcherType.String
      }
    ]
  ],
  [
    "styles", [
      {
        match: MatcherType.String
      }
    ]
  ]
] satisfies Variables;
