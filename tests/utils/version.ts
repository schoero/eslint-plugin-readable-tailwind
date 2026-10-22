import { cwd } from "node:process";

import { getTailwindPackageJsonPath, getTailwindVersion } from "better-tailwindcss:utils/tailwindcss.js";
import { parseSemanticVersion } from "better-tailwindcss:utils/version.js";


export function getTailwindCSSVersion() {
  const packageJsonPath = getTailwindPackageJsonPath(cwd());

  if(!packageJsonPath){
    throw new Error("Tailwind CSS is not installed.");
  }

  return getTailwindVersion(packageJsonPath);
}

export function getNodeVersion() {
  return parseSemanticVersion(process.versions.node);
}
