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
          jsx: `() => <img class="bg-red-500 text-white" />`,
          svelte: `<img class="bg-red-500 text-white" />`,
          vue: `<template><img class="bg-red-500 text-white" /></template>`,

          css: `a { @apply bg-red-500 text-white; }`
        }
      ]
    });
  });

  it("should not report concatenated literals separated by whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="'bg-red-500 ' + 'text-white'" />`,
          astro: `<img class={"bg-red-500 " + "text-white"} />`,
          jsx: `() => <img class={"bg-red-500 " + "text-white"} />`,
          svelte: `<img class={"bg-red-500 " + "text-white"} />`,
          vue: `<template><img :class="'bg-red-500 ' + 'text-white'" /></template>`
        },
        {
          angular: `<img [class]="'bg-red-500' + ' text-white'" />`,
          astro: `<img class={"bg-red-500" + " text-white"} />`,
          jsx: `() => <img class={"bg-red-500" + " text-white"} />`,
          svelte: `<img class={"bg-red-500" + " text-white"} />`,
          vue: `<template><img :class="'bg-red-500' + ' text-white'" /></template>`
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
          jsx: `() => <img class={"bg-" + color} />`,
          svelte: `<img class={"bg-" + color} />`,
          vue: `<template><img :class="'bg-' + color" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="color + '-500'" />`,
          astro: `<img class={color + "-500"} />`,
          jsx: `() => <img class={color + "-500"} />`,
          svelte: `<img class={color + "-500"} />`,
          vue: `<template><img :class="color + '-500'" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="'bg-' + color + '-500'" />`,
          astro: `<img class={"bg-" + color + "-500"} />`,
          jsx: `() => <img class={"bg-" + color + "-500"} />`,
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
          jsx: `() => <img class={\`bg-\${color}\`} />`,
          svelte: `<img class={\`bg-\${color}\`} />`,
          vue: `<template><img :class="\`bg-\${color}\`" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="\`\${color}-500\`" />`,
          astro: `<img class={\`\${color}-500\`} />`,
          jsx: `() => <img class={\`\${color}-500\`} />`,
          svelte: `<img class={\`\${color}-500\`} />`,
          vue: `<template><img :class="\`\${color}-500\`" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="\`bg-\${color}-500\`" />`,
          astro: `<img class={\`bg-\${color}-500\`} />`,
          jsx: `() => <img class={\`bg-\${color}-500\`} />`,
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
          jsx: `() => <img class={"static bg-" + color + " text-white trailing"} />`,
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
          jsx: `() => <img class={\`bg-red-500 \${color}\`} />`,
          svelte: `<img class={\`bg-red-500 \${color}\`} />`,
          vue: `<template><img :class="\`bg-red-500 \${color}\`" /></template>`
        },
        {
          angular: `<img [class]="\`\${color} bg-red-500\`" />`,
          astro: `<img class={\`\${color} bg-red-500\`} />`,
          jsx: `() => <img class={\`\${color} bg-red-500\`} />`,
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
          jsx: `() => <img class={\`bg-\${color}-\${shade}-500\`} />`,
          svelte: `<img class={\`bg-\${color}-\${shade}-500\`} />`,
          vue: `<template><img :class="\`bg-\${color}-\${shade}-500\`" /></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should not report templates without literal classes", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`\${color}\`" />`,
          astro: `<img class={\`\${color}\`} />`,
          jsx: `() => <img class={\`\${color}\`} />`,
          svelte: `<img class={\`\${color}\`} />`,
          vue: `<template><img :class="\`\${color}\`" /></template>`
        },
        {
          angular: `<img [class]="\`\${color}\${shade}\`" />`,
          astro: `<img class={\`\${color}\${shade}\`} />`,
          jsx: `() => <img class={\`\${color}\${shade}\`} />`,
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
          jsx: `() => <img class={\` bg-\${color} \`} />`,
          svelte: `<img class={\` bg-\${color} \`} />`,
          vue: `<template><img :class="\` bg-\${color} \`" /></template>`,

          errors: 1
        },
        {
          angular: `<img [class]="\` \${color}-500  \`" />`,
          astro: `<img class={\` \${color}-500  \`} />`,
          jsx: `() => <img class={\` \${color}-500  \`} />`,
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
          astro: `<img class={\`bg-\${color}\` + "-500"} />`,
          jsx: `() => <img class={\`bg-\${color}\` + "-500"} />`,
          svelte: `<img class={\`bg-\${color}\` + "-500"} />`,
          vue: `<template><img :class="\`bg-\${color}\` + '-500'" /></template>`,

          errors: 2
        }
      ]
    });
  });

  it("should report concatenation across empty-string bridges", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="'bg-' + '' + 'red-500'" />`,
          astro: `<img class={"bg-" + "" + "red-500"} />`,
          jsx: `() => <img class={"bg-" + "" + "red-500"} />`,
          svelte: `<img class={"bg-" + "" + "red-500"} />`,
          vue: `<template><img :class="'bg-' + '' + 'red-500'" /></template>`,

          errors: 2
        }
      ],
      valid: [
        {
          angular: `<img [class]="'bg-red-500' + ''" />`,
          astro: `<img class={"bg-red-500" + ""} />`,
          jsx: `() => <img class={"bg-red-500" + ""} />`,
          svelte: `<img class={"bg-red-500" + ""} />`,
          vue: `<template><img :class="'bg-red-500' + ''" /></template>`
        },
        {
          angular: `<img [class]="'bg-red-500' + '' + ''" />`,
          astro: `<img class={"bg-red-500" + "" + ""} />`,
          jsx: `() => <img class={"bg-red-500" + "" + ""} />`,
          svelte: `<img class={"bg-red-500" + "" + ""} />`,
          vue: `<template><img :class="'bg-red-500' + '' + ''" /></template>`
        }
      ]
    });
  });

  it("should not report ternary branches when the left literal ends with a whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<div [class]="'flex w-full min-w-0 ' + (menuOpen ? 'gap-1' : 'flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0 " + (menuOpen ? "gap-1" : "flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0 " + (menuOpen ? "gap-1" : "flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0 " + (menuOpen ? "gap-1" : "flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0 ' + (menuOpen ? 'gap-1' : 'flex-col gap-0')"></div></template>`
        }
      ]
    });
  });

  it("should not report interpolated ternary branches when the left literal ends with a whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`flex w-full min-w-0 \${menuOpen ? 'gap-1' : 'flex-col gap-0'}\`" />`,
          astro: `<img class={\`flex w-full min-w-0 \${menuOpen ? "gap-1" : "flex-col gap-0"}\`} />`,
          jsx: `() => <img class={\`flex w-full min-w-0 \${menuOpen ? "gap-1" : "flex-col gap-0"}\`} />`,
          svelte: `<img class={\`flex w-full min-w-0 \${menuOpen ? "gap-1" : "flex-col gap-0"}\`} />`,
          vue: `<template><img :class="\`flex w-full min-w-0 \${menuOpen ? 'gap-1' : 'flex-col gap-0'}\`" /></template>`
        }
      ]
    });
  });

  it("should not report ternary branches when the right literal starts with a whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<div [class]="'flex w-full min-w-0' + (menuOpen ? ' gap-1' : ' flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" : " flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" : " flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" : " flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0' + (menuOpen ? ' gap-1' : ' flex-col gap-0')"></div></template>`
        }
      ]
    });
  });

  it("should not report interpolated ternary branches when the right literal starts with a whitespace in jsx", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`flex w-full min-w-0\${menuOpen ? ' gap-1' : ' flex-col gap-0'}\`" />`,
          astro: `<img class={\`flex w-full min-w-0\${menuOpen ? " gap-1" : " flex-col gap-0"}\`} />`,
          jsx: `() => <img class={\`flex w-full min-w-0\${menuOpen ? " gap-1" : " flex-col gap-0"}\`} />`,
          svelte: `<img class={\`flex w-full min-w-0\${menuOpen ? " gap-1" : " flex-col gap-0"}\`} />`,
          vue: `<template><img :class="\`flex w-full min-w-0\${menuOpen ? ' gap-1' : ' flex-col gap-0'}\`" /></template>`
        }
      ]
    });
  });

  it("should report interpolated ternary branches when neither side has surrounding whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-red-500\${someVar ? 'text-white' : 'text-black'}\`" />`,
          astro: `<img class={\`bg-red-500\${someVar ? "text-white" : "text-black"}\`} />`,
          jsx: `() => <img class={\`bg-red-500\${someVar ? "text-white" : "text-black"}\`} />`,
          svelte: `<img class={\`bg-red-500\${someVar ? "text-white" : "text-black"}\`} />`,
          vue: `<template><img :class="\`bg-red-500\${someVar ? 'text-white' : 'text-black'}\`" /></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should report ternary branches when neither side has surrounding whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<div [class]="'flex w-full min-w-0' + (menuOpen ? 'gap-1' : 'flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0" + (menuOpen ? "gap-1" : "flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0" + (menuOpen ? "gap-1" : "flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0" + (menuOpen ? "gap-1" : "flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0' + (menuOpen ? 'gap-1' : 'flex-col gap-0')"></div></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should only report the ternary branches without surrounding whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<div [class]="'flex w-full min-w-0' + (menuOpen ? ' gap-1' : 'flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" : "flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" : "flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" : "flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0' + (menuOpen ? ' gap-1' : 'flex-col gap-0')"></div></template>`,

          errors: 2
        }
      ]
    });
  });

  it("should not report deeply nested ternary branches when the left literal ends with a whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<div [class]="'flex w-full min-w-0 ' + (menuOpen ? 'gap-1 ' + (sidebarOpen ? 'left-100' : 'left-0') : 'flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0 " + (menuOpen ? "gap-1 " + (sidebarOpen ? "left-100" : "left-0")  : "flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0 " + (menuOpen ? "gap-1 " + (sidebarOpen ? "left-100" : "left-0") : "flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0 " + (menuOpen ? "gap-1 " + (sidebarOpen ? "left-100" : "left-0") : "flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0 ' + (menuOpen ? 'gap-1 ' + (sidebarOpen ? 'left-100' : 'left-0') : 'flex-col gap-0')"></div></template>`
        }
      ]
    });
  });

  it("should not report deeply nested ternary branches when the right literal ends with a whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<div [class]="'flex w-full min-w-0' + (menuOpen ? ' gap-1' + (sidebarOpen ? ' left-100' : ' left-0') : ' flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" + (sidebarOpen ? " left-100" : " left-0")  : " flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" + (sidebarOpen ? " left-100" : " left-0") : " flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0" + (menuOpen ? " gap-1" + (sidebarOpen ? " left-100" : " left-0") : " flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0' + (menuOpen ? ' gap-1' + (sidebarOpen ? ' left-100' : ' left-0') : ' flex-col gap-0')"></div></template>`
        }
      ]
    });
  });

  it("should report deeply nested ternary branches when neither literal has surrounding whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<div [class]="'flex w-full min-w-0' + (menuOpen ? 'gap-1' + (sidebarOpen ? 'left-100' : 'left-0') : 'flex-col gap-0')"></div>`,
          astro: `<div class={"flex w-full min-w-0" + (menuOpen ? "gap-1" + (sidebarOpen ? "left-100" : "left-0")  : "flex-col gap-0")} />`,
          jsx: `() => <div class={"flex w-full min-w-0" + (menuOpen ? "gap-1" + (sidebarOpen ? "left-100" : "left-0") : "flex-col gap-0")} />`,
          svelte: `<div class={"flex w-full min-w-0" + (menuOpen ? "gap-1" + (sidebarOpen ? "left-100" : "left-0") : "flex-col gap-0")} />`,
          vue: `<template><div :class="'flex w-full min-w-0' + (menuOpen ? 'gap-1' + (sidebarOpen ? 'left-100' : 'left-0') : 'flex-col gap-0')"></div></template>`,

          errors: 5
        }
      ]
    });
  });

  it("should not report concatenation with a whitespace-only literal", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="'bg-red-500' + ' '" />`,
          astro: `<img class={"bg-red-500" + " "} />`,
          jsx: `() => <img class={"bg-red-500" + " "} />`,
          svelte: `<img class={"bg-red-500" + " "} />`,
          vue: `<template><img :class="'bg-red-500' + ' '" /></template>`
        }
      ]
    });
  });

  it("should report ternary branches with leading whitespace only", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<div [class]="' flex' + (menuOpen ? 'gap-1' : 'gap-2')"></div>`,
          astro: `<div class={" flex" + (menuOpen ? "gap-1" : "gap-2")} />`,
          jsx: `() => <div class={" flex" + (menuOpen ? "gap-1" : "gap-2")} />`,
          svelte: `<div class={" flex" + (menuOpen ? "gap-1" : "gap-2")} />`,
          vue: `<template><div :class="' flex' + (menuOpen ? 'gap-1' : 'gap-2')"></div></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should not report multiple interpolations separated by whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`\${color} \${shade}\`" />`,
          astro: `<img class={\`\${color} \${shade}\`} />`,
          jsx: `() => <img class={\`\${color} \${shade}\`} />`,
          svelte: `<img class={\`\${color} \${shade}\`} />`,
          vue: `<template><img :class="\`\${color} \${shade}\`" /></template>`
        }
      ]
    });
  });

  it("should not report when no class literals are present", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`\${color}\${shade}\`" />`,
          astro: `<img class={\`\${color}\${shade}\`} />`,
          jsx: `() => <img class={\`\${color}\${shade}\`} />`,
          svelte: `<img class={\`\${color}\${shade}\`} />`,
          vue: `<template><img :class="\`\${color}\${shade}\`" /></template>`
        }
      ]
    });
  });

  it("should report literal class joined to leading interpolation without whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`\${color}-500\`" />`,
          astro: `<img class={\`\${color}-500\`} />`,
          jsx: `() => <img class={\`\${color}-500\`} />`,
          svelte: `<img class={\`\${color}-500\`} />`,
          vue: `<template><img :class="\`\${color}-500\`" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report literal class joined to trailing interpolation without whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${color}\`" />`,
          astro: `<img class={\`bg-\${color}\`} />`,
          jsx: `() => <img class={\`bg-\${color}\`} />`,
          svelte: `<img class={\`bg-\${color}\`} />`,
          vue: `<template><img :class="\`bg-\${color}\`" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report when a template starts with an interpolation immediately followed by a class", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`\${color}text-white\`" />`,
          astro: `<img class={\`\${color}text-white\`} />`,
          jsx: `() => <img class={\`\${color}text-white\`} />`,
          svelte: `<img class={\`\${color}text-white\`} />`,
          vue: `<template><img :class="\`\${color}text-white\`" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should report when a template ends with a class immediately followed by an interpolation", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-red-500\${color}\`" />`,
          astro: `<img class={\`bg-red-500\${color}\`} />`,
          jsx: `() => <img class={\`bg-red-500\${color}\`} />`,
          svelte: `<img class={\`bg-red-500\${color}\`} />`,
          vue: `<template><img :class="\`bg-red-500\${color}\`" /></template>`,

          errors: 1
        }
      ]
    });
  });

  it("should not report interpolations separated from all static classes by whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`bg-red-500 \${color} text-white\`" />`,
          astro: `<img class={\`bg-red-500 \${color} text-white\`} />`,
          jsx: `() => <img class={\`bg-red-500 \${color} text-white\`} />`,
          svelte: `<img class={\`bg-red-500 \${color} text-white\`} />`,
          vue: `<template><img :class="\`bg-red-500 \${color} text-white\`" /></template>`
        }
      ]
    });
  });

  it("should report every concatenated edge around multiple interpolations", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${color}\${shade}\${opacity}text-white\`" />`,
          astro: `<img class={\`bg-\${color}\${shade}\${opacity}text-white\`} />`,
          jsx: `() => <img class={\`bg-\${color}\${shade}\${opacity}text-white\`} />`,
          svelte: `<img class={\`bg-\${color}\${shade}\${opacity}text-white\`} />`,
          vue: `<template><img :class="\`bg-\${color}\${shade}\${opacity}text-white\`" /></template>`,

          errors: 2
        },
        {
          angular: `<img [class]="\`bg-\${color}-\${shade}/\${opacity}\`" />`,
          astro: `<img class={\`bg-\${color}-\${shade}/\${opacity}\`} />`,
          jsx: `() => <img class={\`bg-\${color}-\${shade}/\${opacity}\`} />`,
          svelte: `<img class={\`bg-\${color}-\${shade}/\${opacity}\`} />`,
          vue: `<template><img :class="\`bg-\${color}-\${shade}/\${opacity}\`" /></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should not report && branches when separated by whitespace", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`bg-red-500 \${someVar && 'text-white'}\`" />`,
          astro: `<img class={\`bg-red-500 \${someVar && "text-white"}\`} />`,
          jsx: `() => <img class={\`bg-red-500 \${someVar && "text-white"}\`} />`,
          svelte: `<img class={\`bg-red-500 \${someVar && "text-white"}\`} />`,
          vue: `<template><img :class="\`bg-red-500 \${someVar && 'text-white'}\`" /></template>`
        },
        {
          angular: `<img [class]="\`\${someVar && 'text-white'} bg-red-500\`" />`,
          astro: `<img class={\`\${someVar && "text-white"} bg-red-500\`} />`,
          jsx: `() => <img class={\`\${someVar && "text-white"} bg-red-500\`} />`,
          svelte: `<img class={\`\${someVar && "text-white"} bg-red-500\`} />`,
          vue: `<template><img :class="\`\${someVar && 'text-white'} bg-red-500\`" /></template>`
        },
        {
          angular: `<img [class]="\`bg-red-500\${someVar && ' text-white'}\`" />`,
          astro: `<img class={\`bg-red-500\${someVar && " text-white"}\`} />`,
          jsx: `() => <img class={\`bg-red-500\${someVar && " text-white"}\`} />`,
          svelte: `<img class={\`bg-red-500\${someVar && " text-white"}\`} />`,
          vue: `<template><img :class="\`bg-red-500\${someVar && ' text-white'}\`" /></template>`
        },
        {
          angular: `<img [class]="\`\${someVar && 'text-white '}bg-red-500\`" />`,
          astro: `<img class={\`\${someVar && "text-white "}bg-red-500\`} />`,
          jsx: `() => <img class={\`\${someVar && "text-white "}bg-red-500\`} />`,
          svelte: `<img class={\`\${someVar && "text-white "}bg-red-500\`} />`,
          vue: `<template><img :class="\`\${someVar && 'text-white '}bg-red-500\`" /></template>`
        }
      ]
    });
  });

  it("should report && branches when not separated by whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-red-500\${someVar && 'text-white'}\`" />`,
          astro: `<img class={\`bg-red-500\${someVar && "text-white"}\`} />`,
          jsx: `() => <img class={\`bg-red-500\${someVar && "text-white"}\`} />`,
          svelte: `<img class={\`bg-red-500\${someVar && "text-white"}\`} />`,
          vue: `<template><img :class="\`bg-red-500\${someVar && 'text-white'}\`" /></template>`,

          errors: 2
        },
        {
          angular: `<img [class]="\`\${someVar && 'text-white'}bg-red-500\`" />`,
          astro: `<img class={\`\${someVar && "text-white"}bg-red-500\`} />`,
          jsx: `() => <img class={\`\${someVar && "text-white"}bg-red-500\`} />`,
          svelte: `<img class={\`\${someVar && "text-white"}bg-red-500\`} />`,
          vue: `<template><img :class="\`\${someVar && 'text-white'}bg-red-500\`" /></template>`,

          errors: 2
        }
      ]
    });
  });

  it("should report multiple && branches in one class string", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-red-500\${someVar && 'text-white'}\${otherVar && 'font-bold'}\`" />`,
          astro: `<img class={\`bg-red-500\${someVar && "text-white"}\${otherVar && "font-bold"}\`} />`,
          jsx: `() => <img class={\`bg-red-500\${someVar && "text-white"}\${otherVar && "font-bold"}\`} />`,
          svelte: `<img class={\`bg-red-500\${someVar && "text-white"}\${otherVar && "font-bold"}\`} />`,
          vue: `<template><img :class="\`bg-red-500\${someVar && 'text-white'}\${otherVar && 'font-bold'}\`" /></template>`,

          errors: 3
        }
      ]
    });
  });

  it("should report && branches concatenated with plus operator", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="'bg-red-500' + (someVar && 'text-white')" />`,
          astro: `<img class={"bg-red-500" + (someVar && "text-white")} />`,
          jsx: `() => <img class={"bg-red-500" + (someVar && "text-white")} />`,
          svelte: `<img class={"bg-red-500" + (someVar && "text-white")} />`,
          vue: `<template><img :class="'bg-red-500' + (someVar && 'text-white')" /></template>`,

          errors: 2
        }
      ],
      valid: [
        {
          angular: `<img [class]="'bg-red-500 ' + (someVar && 'text-white')" />`,
          astro: `<img class={"bg-red-500 " + (someVar && "text-white")} />`,
          jsx: `() => <img class={"bg-red-500 " + (someVar && "text-white")} />`,
          svelte: `<img class={"bg-red-500 " + (someVar && "text-white")} />`,
          vue: `<template><img :class="'bg-red-500 ' + (someVar && 'text-white')" /></template>`
        }
      ]
    });
  });

  it("should report nested && branches when neither side has surrounding whitespace", () => {
    lint(noConcatenatedClasses, {
      invalid: [
        {
          angular: `<img [class]="\`bg-\${someVar && \`red-\${otherVar && '500'}\`}\`" />`,
          astro: `<img class={\`bg-\${someVar && \`red-\${otherVar && "500"}\`}\`} />`,
          jsx: `() => <img class={\`bg-\${someVar && \`red-\${otherVar && "500"}\`}\`} />`,
          svelte: `<img class={\`bg-\${someVar && \`red-\${otherVar && "500"}\`}\`} />`,
          vue: `<template><img :class="\`bg-\${someVar && \`red-\${otherVar && '500'}\`}\`" /></template>`,

          errors: 3
        }
      ]
    });
  });

  // #406
  it("should report nested template literals inside a template literal interpolation", () => {
    lint(noConcatenatedClasses, {
      valid: [{
        jsx: `<img class={\`h-1.5 \${balance > 0 ? \`rounded-r-full\` : \`rounded-l-full\`}\`} />`
      }]
    });
  });

  // #413
  it("should not report on a nullish coalescing operator fallback", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`h-1.5 \${classes ?? 'rounded-r-full'}\`" />`,
          astro: `<img class={\`h-1.5 \${classes ?? "rounded-r-full"}\`} />`,
          jsx: `<img class={\`h-1.5 \${classes ?? "rounded-r-full"}\`} />`,
          svelte: `<img class={\`h-1.5 \${classes ?? "rounded-r-full"}\`} />`,
          vue: `<template><img :class="\`h-1.5 \${classes ?? 'rounded-r-full'}\`" /></template>`
        },
        {
          angular: `<img [class]="'h-1.5 ' + (classes ?? 'rounded-r-full')" />`,
          astro: `<img class={'h-1.5 ' + (classes ?? "rounded-r-full")} />`,
          jsx: `<img class={'h-1.5 ' + (classes ?? "rounded-r-full")} />`,
          svelte: `<img class={'h-1.5 ' + (classes ?? "rounded-r-full")} />`,
          vue: `<template><img :class="'h-1.5 ' + (classes ?? 'rounded-r-full')" /></template>`
        }
      ]
    });
  });
  it("should not report on a logical or operator fallback", () => {
    lint(noConcatenatedClasses, {
      valid: [
        {
          angular: `<img [class]="\`h-1.5 \${classes || 'rounded-r-full'}\`" />`,
          astro: `<img class={\`h-1.5 \${classes || "rounded-r-full"}\`} />`,
          jsx: `<img class={\`h-1.5 \${classes || "rounded-r-full"}\`} />`,
          svelte: `<img class={\`h-1.5 \${classes || "rounded-r-full"}\`} />`,
          vue: `<template><img :class="\`h-1.5 \${classes || "rounded-r-full"}\`" /></template>`
        },
        {
          angular: `<img [class]="'h-1.5 ' + (classes || 'rounded-r-full')" />`,
          astro: `<img class={'h-1.5 ' + (classes || "rounded-r-full")} />`,
          jsx: `<img class={'h-1.5 ' + (classes || "rounded-r-full")} />`,
          svelte: `<img class={'h-1.5 ' + (classes || "rounded-r-full")} />`,
          vue: `<template><img :class="'h-1.5 ' + (classes || "rounded-r-full")" /></template>`
        }
      ]
    });
  });

});
