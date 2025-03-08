import { runAsWorker } from "synckit";

import type { GetClassOrderRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


let getClassOrderModule: typeof import("../v3/class-order.js") | typeof import("../v4/class-order.js");

runAsWorker(async (version: SupportedTailwindVersion, request: GetClassOrderRequest) => {
  getClassOrderModule ??= await import(`../v${version}/class-order.js`);
  return getClassOrderModule.getClassOrder(request);
});
