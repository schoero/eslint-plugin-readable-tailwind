export function escapeForRegex(word: string) {
  return word.replace(/[$()*+./?[\\\]^{|}-]/g, "\\$&");
}
