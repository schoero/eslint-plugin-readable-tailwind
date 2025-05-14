import { runAsWorker } from "synckit";

import type { GetConflictingClassesRequest } from "../api/interface.js";
import type { TailwindcssVersion } from "../utils/version.js";


let getConflictingClassesModule: typeof import("../v4/conflicting-classes.js");

runAsWorker(async (version: TailwindcssVersion.V4, request: GetConflictingClassesRequest) => {
  getConflictingClassesModule ??= await import(`../v${version}/conflicting-classes.js`);
  return getConflictingClassesModule.getConflictingClasses(request);
});
