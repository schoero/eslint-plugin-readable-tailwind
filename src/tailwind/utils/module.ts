export function isCommonJSModule() {
  return typeof module !== "undefined" && typeof module.exports !== "undefined";
}
