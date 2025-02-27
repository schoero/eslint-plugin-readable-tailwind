import { config } from "@schoero/configs/vite";

export default {
  ...config,
  test: {
    ...config.test,
    poolOptions:{
      threads: {
        maxThreads: "50%",
      }
    },
  }
}