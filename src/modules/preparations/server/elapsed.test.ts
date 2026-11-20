import { describe, expect, it } from "vitest";

import { absoluteFromElapsed, formatElapsed, sessionOriginMs, toElapsedMs } from "./elapsed";

describe("elapsed", () => {
  it("formats a turn relative to session start as mm:ss", () => {
    const origin = new Date("2026-11-17T14:00:00.000Z");
    const turn = new Date("2026-11-17T14:02:07.000Z");
    expect(formatElapsed(toElapsedMs(turn, origin.getTime()))).toBe("2:07");
  });

  it("keeps stream-relative timestamps as elapsed", () => {
    expect(formatElapsed(12000)).toBe("0:12");
    expect(absoluteFromElapsed(12000, 1_000)).toBe(13_000);
  });

  it("prefers the run start over the first turn", () => {
    const runStartedAt = new Date("2026-11-17T14:00:00.000Z");
    const firstTurnAt = new Date("2026-11-17T14:00:40.000Z");
    expect(sessionOriginMs(runStartedAt, firstTurnAt)).toBe(runStartedAt.getTime());
  });
});
