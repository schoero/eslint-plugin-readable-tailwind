import { createSyncFn } from "synckit";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { describe, expect, it } from "vitest";

/**
 * Regression for #386 / #415: with synckit 0.11, two timeouts against a shared
 * wake-up counter leave later calls permanently stuck in Atomics.wait().
 * synckit >= 0.12 isolates notifications per worker so calls recover.
 */
describe("synckit timeout recovery", () => {
  it("recovers after timed-out calls instead of hanging forever", async () => {
    const workerPath = resolve(import.meta.dirname, "../fixtures/synckit-timeout/slow-worker.mjs");
    const run = createSyncFn<(ms: number) => number>(workerPath, { timeout: 50 });

    const timedOut = (ms: number) => {
      try {
        run(ms);
        return false;
      } catch (error) {
        return error instanceof Error && /timed-out|timeout/i.test(error.message);
      }
    };

    expect(timedOut(200)).toBe(true);
    expect(timedOut(200)).toBe(true);

    // Late replies from the timed-out calls arrive while we are not waiting.
    await sleep(500);

    // With synckit 0.11 these would each wait the full timeout and fail.
    // With 0.12 they return promptly.
    const started = performance.now();
    expect(run(10)).toBe(10);
    expect(run(10)).toBe(10);
    expect(run(10)).toBe(10);
    expect(performance.now() - started).toBeLessThan(200);
  }, 15_000);
});
