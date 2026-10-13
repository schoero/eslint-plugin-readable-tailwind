import { runAsWorker } from "synckit";
import { setTimeout as sleep } from "node:timers/promises";

runAsWorker(async (ms) => {
  await sleep(ms);
  return ms;
});
