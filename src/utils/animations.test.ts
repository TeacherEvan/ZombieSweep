import { describe, expect, it, vi } from "vitest";

// Mock Phaser — its module-level init requires `window` which doesn't exist in Node
vi.mock("phaser", () => ({ default: {} }));

import { STATION_BREAK, prefersReducedMotion } from "./animations";

describe("animations", () => {
  describe("STATION_BREAK config", () => {
    it("should define wipe-in duration in ms", () => {
      expect(STATION_BREAK.WIPE_IN_MS).toBe(250);
    });

    it("should define hold duration in ms", () => {
      expect(STATION_BREAK.HOLD_MS).toBe(200);
    });

    it("should define overlay depth above all game content", () => {
      expect(STATION_BREAK.DEPTH).toBeGreaterThanOrEqual(999);
    });

    it("should define red accent bar height in px", () => {
      expect(STATION_BREAK.BAR_HEIGHT).toBe(6);
    });

    it("should define station ID text", () => {
      expect(STATION_BREAK.STATION_ID).toBe("WZMB 13");
    });
  });

  describe("prefersReducedMotion", () => {
    it("should return false when window is undefined (SSR/node)", () => {
      expect(prefersReducedMotion()).toBe(false);
    });
  });
});
