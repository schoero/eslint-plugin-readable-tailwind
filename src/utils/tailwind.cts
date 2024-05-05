import fs = require("node:fs");
import path = require("node:path");


function parseSemanticVersion(version: string): { major: number; minor: number; patch: number; identifier?: string; } {
  const [major, minor, patchString] = version.split(".");
  const [patch, identifier] = patchString.split("-");

  return { identifier, major: +major, minor: +minor, patch: +patch };
}

function getTailwindcssVersion() {

  const packageJsonPath = require.resolve("tailwindcss/package.json");

  if(!packageJsonPath){
    return;
  }

  const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
  const json = JSON.parse(packageJson);
  const version = parseSemanticVersion(json.version);

  return version;

}

function importTailwindCss(cwd: string, tailwindConfig?: string) {

  const version = getTailwindcssVersion();

  const getClassOrder = version?.major === 4
    ? require("./tailwind-v4.cjs")
    : require("./tailwind-v3.cjs");

  return (classes: string[]) => getClassOrder(cwd, tailwindConfig, classes);

}

function resolve(cwd: string, location: string) {
  try {
    return require.resolve(location, { paths: [cwd] });
  } catch {}

  try {
    const absolutePath = path.resolve(cwd, location);
    return require.resolve(absolutePath, { paths: [cwd] });
  } catch {}
}

export = {
  importTailwindCss,
  resolve
};
