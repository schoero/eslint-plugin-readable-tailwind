import { mkdir, rm, writeFile } from "fs/promises";
import { transformDirname, transformImports } from "better-tailwindcss:build:transform.js";
import { $ } from "better-tailwindcss:build:utils.js";

async function build(){

  const esmDir = "lib/esm"
  const cjsDir = "lib/cjs"

  console.info("Building ESM...")
  await mkdir(esmDir, { recursive: true });
  await $(`npx tsc --project tsconfig.build.esm.json --outDir ${esmDir}`)
  await $(`npx tsc-alias --outDir ${esmDir}`)
  await writeFile(`${esmDir}/package.json`, JSON.stringify({ type: "module" }), "utf-8")
  await transformImports([`${esmDir}/**/*.js`], "tailwindcss3", "tailwindcss")
  await transformImports([`${esmDir}/**/*.js`], "tailwindcss4", "tailwindcss")

  console.info("Building CJS...")
  await mkdir(cjsDir, { recursive: true });
  await $(`npx tsc --project tsconfig.build.cjs.json --outDir ${cjsDir}`)
  await $(`npx tsc-alias --outDir ${cjsDir}`)
  await writeFile(`${cjsDir}/package.json`, JSON.stringify({ type: "commonjs" }),  "utf-8")
  await transformImports([`${cjsDir}/**/*.js`], "tailwindcss3", "tailwindcss")
  await transformImports([`${cjsDir}/**/*.js`], "tailwindcss4", "tailwindcss")
  await transformDirname([`${cjsDir}/**/*.js`])

  console.info("Build complete")

}

build().catch(console.error);