/* eslint-disable eslint-plugin-typescript/naming-convention */

export function plugin() {
  return function({ addUtilities }) {
    addUtilities({
      ".from-plugin": {
        color: "red"
      }
    });
  };
}
