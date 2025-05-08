import { runAsWorker } from "synckit";

import type { GetUnregisteredClassesRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


let getUnregisteredClassesModule: typeof import("../v3/unregistered-classes.js") | typeof import("../v4/unregistered-classes.js");

runAsWorker(async (version: SupportedTailwindVersion, request: GetUnregisteredClassesRequest) => {
  getUnregisteredClassesModule ??= await import(`../v${version}/unregistered-classes.js`);
  return getUnregisteredClassesModule.getUnregisteredClasses(request);
});
