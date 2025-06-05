/* eslint-disable eslint-plugin-typescript/naming-convention */

import createPlugin from "tailwindcss/plugin";


export default createPlugin(({ addUtilities }) => {
  addUtilities({
    ".in-plugin": {
      color: "red"
    }
  });
});
