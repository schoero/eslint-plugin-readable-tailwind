import { writeFile } from "fs/promises";
import { $ } from "readable-tailwind:build:utils.js";

const esmDir = "lib/esm"
const cjsDir = "lib/cjs"

await $`npx tsc --module preserve --project tsconfig.build.esm.json --outDir ${esmDir}`
await $`npx tsc-alias --outDir ${esmDir}`
await writeFile(`${esmDir}/package.json`, JSON.stringify({ type: "module" }), "utf-8")

await $`npx tsc --module commonjs --moduleResolution node --project tsconfig.build.cjs.json --verbatimModuleSyntax false --outDir ${cjsDir}`
await $`npx tsc-alias --outDir ${cjsDir}`
await writeFile(`${cjsDir}/package.json`, JSON.stringify({ type: "commonjs" }),  "utf-8")

