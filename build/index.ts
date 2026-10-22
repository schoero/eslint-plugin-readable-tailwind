import { $ } from "better-tailwindcss:build/utils.js";

async function build(){
  const outDir = "lib"

  console.info("Building...")
  await $(`npx tsc --project tsconfig.build.json --outDir ${outDir}`)
  await $(`npx tsc-alias --project tsconfig.build.json --outDir ${outDir}`)
  console.info("Build complete")
}

build().catch(error => {
  console.error(error)
  process.exitCode = 1
});

