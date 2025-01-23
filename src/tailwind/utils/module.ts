export function isCommonJSModule(): boolean {
  return typeof __dirname === "string";
}
