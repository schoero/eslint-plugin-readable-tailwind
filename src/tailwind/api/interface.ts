export interface GetClassOrderRequest {
  classes: string[];
  cwd: string;
  configPath?: string;
}

export type GetClassOrderResponse = [className: string, order: bigint | null][];
