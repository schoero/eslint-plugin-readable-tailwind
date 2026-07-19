import { describe, it } from "vitest";

import { noConcatenatedClasses } from "better-tailwindcss:rules/no-concatenated-classes.js";
import { lint } from "better-tailwindcss:tests/utils/lint.js";


describe(noConcatenatedClasses.name, () => {

  it("should not report static class strings", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img class="bg-red-500 text-white" />`,
          astro: `<img class="bg-red-500 text-white" />`,
          html: `<img class="bg-red-500 text-white" />`,
          jsx: `() => <img className="bg-red-500 text-white" />`,
          svelte: `<img class="bg-red-500 text-white" />`,
          vue: `<template><img class="bg-red-500 text-white" /></template>`,

          css: `a { @apply bg-red-500 text-white; }`
        }
      ]
    });
  });

  it("should report classes concatenated with plus operator", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="'bg-' + color" />`,
          astro: `<img class={"bg-" + color} />`,
          jsx: `() => <img className={"bg-" + color} />`,
          svelte: `<img class={"bg-" + color} />`,
          vue: `<template><img :class="'bg-' + color" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="color + '-500'" />`,
          astro: `<img class={color + "-500"} />`,
          jsx: `() => <img className={color + "-500"} />`,
          svelte: `<img class={color + "-500"} />`,
          vue: `<template><img :class="color + '-500'" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="'bg-' + color + '-500'" />`,
          astro: `<img class={"bg-" + color + "-500"} />`,
          jsx: `() => <img className={"bg-" + color + "-500"} />`,
          svelte: `<img class={"bg-" + color + "-500"} />`,
          vue: `<template><img :class="'bg-' + color + '-500'" /></template>`,

          errors: 2
        }
      ]
    });
  });

  it("should report interpolated class strings", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${color}\`" />`,
          astro: `<img class={\`bg-\${color}\`} />`,
          jsx: `() => <img className={\`bg-\${color}\`} />`,
          svelte: `<img class={\`bg-\${color}\`} />`,
          vue: `<template><img :class="\`bg-\${color}\`" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="\`\${color}-500\`" />`,
          astro: `<img class={\`\${color}-500\`} />`,
          jsx: `() => <img className={\`\${color}-500\`} />`,
          svelte: `<img class={\`\${color}-500\`} />`,
          vue: `<template><img :class="\`\${color}-500\`" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="\`bg-\${color}-500\`" />`,
          astro: `<img class={\`bg-\${color}-500\`} />`,
          jsx: `() => <img className={\`bg-\${color}-500\`} />`,
          svelte: `<img class={\`bg-\${color}-500\`} />`,
          vue: `<template><img :class="\`bg-\${color}-500\`" /></template>`,

          errors: 2
        }
      ]
    });
  });

  it("should only report the edge classes that are actually concatenated", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="'static bg-' + color + ' text-white trailing'" />`,
          astro: `<img class={"static bg-" + color + " text-white trailing"} />`,
          jsx: `() => <img className={"static bg-" + color + " text-white trailing"} />`,
          svelte: `<img class={"static bg-" + color + " text-white trailing"} />`,
          vue: `<template><img :class="'static bg-' + color + ' text-white trailing'" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should not report interpolation separated from classes by whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`bg-red-500 \${color}\`" />`,
          astro: `<img class={\`bg-red-500 \${color}\`} />`,
          jsx: `() => <img className={\`bg-red-500 \${color}\`} />`,
          svelte: `<img class={\`bg-red-500 \${color}\`} />`,
          vue: `<template><img :class="\`bg-red-500 \${color}\`" /></template>`
        },
        {
          angular: `<img [class]="\`\${color} bg-red-500\`" />`,
          astro: `<img class={\`\${color} bg-red-500\`} />`,
          jsx: `() => <img className={\`\${color} bg-red-500\`} />`,
          svelte: `<img class={\`\${color} bg-red-500\`} />`,
          vue: `<template><img :class="\`\${color} bg-red-500\`" /></template>`
        }
      ]
    });
  });

  it("should report multiple interpolations in one class string", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${color}-\${shade}-500\`" />`,
          astro: `<img class={\`bg-\${color}-\${shade}-500\`} />`,
          jsx: `() => <img className={\`bg-\${color}-\${shade}-500\`} />`,
          svelte: `<img class={\`bg-\${color}-\${shade}-500\`} />`,
          vue: `<template><img :class="\`bg-\${color}-\${shade}-500\`" /></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should not report templates without static class fragments", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`\${color}\`" />`,
          astro: `<img class={\`\${color}\`} />`,
          jsx: `() => <img className={\`\${color}\`} />`,
          svelte: `<img class={\`\${color}\`} />`,
          vue: `<template><img :class="\`\${color}\`" /></template>`
        },
        {
          angular: `<img [class]="\`\${color}\${shade}\`" />`,
          astro: `<img class={\`\${color}\${shade}\`} />`,
          jsx: `() => <img className={\`\${color}\${shade}\`} />`,
          svelte: `<img class={\`\${color}\${shade}\`} />`,
          vue: `<template><img :class="\`\${color}\${shade}\`" /></template>`
        }
      ]
    });
  });

  it("should report interpolated class fragments with outer whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\` bg-\${color} \`" />`,
          astro: `<img class={\` bg-\${color} \`} />`,
          jsx: `() => <img className={\` bg-\${color} \`} />`,
          svelte: `<img class={\` bg-\${color} \`} />`,
          vue: `<template><img :class="\` bg-\${color} \`" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="\` \${color}-500  \`" />`,
          astro: `<img class={\` \${color}-500  \`} />`,
          jsx: `() => <img className={\` \${color}-500  \`} />`,
          svelte: `<img class={\` \${color}-500  \`} />`,
          vue: `<template><img :class="\` \${color}-500  \`" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report mixed plus and template concatenation", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${color}\` + '-500'" />`,
          astro: `<img class={"bg-" + \`\${color}\` + "-500"} />`,
          jsx: `() => <img className={"bg-" + \`\${color}\` + "-500"} />`,
          svelte: `<img class={"bg-" + \`\${color}\` + "-500"} />`,
          vue: `<template><img :class="'bg-' + \`\${color}\` + '-500'" /></template>`,

          errors: 2
        }
      ]
    });
  });

});
