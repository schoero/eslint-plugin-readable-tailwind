import { runAsWorker } from "synckit";

import type { GetUnregisteredClassesRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


let getUnregisteredClassesModule: typeof import("../v3/prefix.js") | typeof import("../v4/prefix.js");

runAsWorker(async (version: SupportedTailwindVersion, request: GetUnregisteredClassesRequest) => {
  getUnregisteredClassesModule ??= await import(`../v${version}/prefix.js`);
  return getUnregisteredClassesModule.getPrefix(request);
});
