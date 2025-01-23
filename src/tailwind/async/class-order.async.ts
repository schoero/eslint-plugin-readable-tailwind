import { runAsWorker } from "synckit";

import type { GetClassOrderRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


runAsWorker(async (version: SupportedTailwindVersion, request: GetClassOrderRequest) => {
  const { getClassOrder } = await import(`../v${version}/index.js`);
  return getClassOrder(request);
});
