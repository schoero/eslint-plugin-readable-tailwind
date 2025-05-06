import { runAsWorker } from "synckit";

import type { GetConflictingClassesRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


let getConflictingClassesModule: typeof import("../v3/conflicting-classes.js") | typeof import("../v4/conflicting-classes.js");

runAsWorker(async (version: SupportedTailwindVersion, request: GetConflictingClassesRequest) => {
  getConflictingClassesModule ??= await import(`../v${version}/conflicting-classes.js`);
  return getConflictingClassesModule.getConflictingClasses(request);
});
