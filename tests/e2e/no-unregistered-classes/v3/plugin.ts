/* eslint-disable eslint-plugin-typescript/naming-convention */

import type { PluginCreator } from "tailwindcss/types/config";


export function plugin(): PluginCreator {
  return function({ addUtilities }) {
    addUtilities({
      ".from-plugin": {
        color: "red"
      }
    });
  };
}
