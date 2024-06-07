import { writeFile } from "fs/promises";
import { transformImports } from "readable-tailwind:build:transform.js";
import { $ } from "readable-tailwind:build:utils.js";

async function build(){

  const esmDir = "lib/esm"
  const cjsDir = "lib/cjs"

  console.info("Building ESM...")
  await $`npx tsc --module preserve --project tsconfig.build.esm.json --outDir ${esmDir}`
  await $`npx tsc-alias --outDir ${esmDir}`
  await writeFile(`${esmDir}/package.json`, JSON.stringify({ type: "module" }), "utf-8")
  await transformImports([`${esmDir}/**/*.cjs`], "tailwindcss3", "tailwindcss")
  await transformImports([`${esmDir}/**/*.cjs`], "tailwindcss4", "tailwindcss")

  console.info("Building CJS...")
  await $`npx tsc --module commonjs --moduleResolution node --project tsconfig.build.cjs.json --verbatimModuleSyntax false --outDir ${cjsDir}`
  await $`npx tsc-alias --outDir ${cjsDir}`
  await writeFile(`${cjsDir}/package.json`, JSON.stringify({ type: "commonjs" }),  "utf-8")
  await transformImports([`${cjsDir}/**/*.cjs`], "tailwindcss3", "tailwindcss")
  await transformImports([`${cjsDir}/**/*.cjs`], "tailwindcss4", "tailwindcss")

  console.info("Build complete")

}

build().catch(console.error);
