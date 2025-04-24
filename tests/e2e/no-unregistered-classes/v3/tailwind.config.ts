import { plugin } from "./plugin.js"

export default {
  plugins: [
    plugin(),
  ],
  theme: {
    extend: {
      colors: {
        "config": "red"
      },
    },
  },
}