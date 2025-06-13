import { runAsWorker } from "synckit";

import type { GetCustomComponentClassesRequest } from "../api/interface.js";
import type { SupportedTailwindVersion } from "../utils/version.js";


let getCustomComponentClassesModule: typeof import("../v3/custom-component-classes.js") | typeof import("../v4/custom-component-classes.js");

runAsWorker(async (version: SupportedTailwindVersion, request: GetCustomComponentClassesRequest) => {
  getCustomComponentClassesModule ??= await import(`../v${version}/custom-component-classes.js`);
  return getCustomComponentClassesModule.getCustomComponentClasses(request);
});
