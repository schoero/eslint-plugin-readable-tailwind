import { runAsWorker } from "synckit";

import type { GetClassOrderRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


let getClassOrderModule: typeof import("../v3/index.js") | typeof import("../v4/index.js");

runAsWorker(async (version: SupportedTailwindVersion, request: GetClassOrderRequest) => {
  getClassOrderModule ??= await import(`../v${version}/index.js`);
  return getClassOrderModule.getClassOrder(request);
});
