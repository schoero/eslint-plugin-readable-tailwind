import { setTimeout as sleep } from "node:timers/promises";

import { runAsWorker } from "synckit";


runAsWorker(async ms => {
  await sleep(ms);
  return ms;
});
