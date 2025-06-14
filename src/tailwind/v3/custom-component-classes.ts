import type { GetCustomComponentClassesRequest, GetCustomComponentClassesResponse } from "../api/interface.js";


export async function getCustomComponentClasses({ configPath, cwd }: GetCustomComponentClassesRequest): Promise<GetCustomComponentClassesResponse> {
  return [[], []];
}
