import { describe, expect, it, vi } from "vitest";

// Mock Phaser — its module-level init requires `window` which doesn't exist in Node
vi.mock("phaser", () => ({ default: {} }));

import { STATION_BREAK, fadeIn, prefersReducedMotion } from "./animations";

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

  describe("fadeIn", () => {
    it("should add a full-screen overlay and destroy it after the tween completes", () => {
      const destroy = vi.fn();
      const fillRect = vi.fn();
      const fillStyle = vi.fn().mockReturnThis();
      const setDepth = vi.fn().mockReturnThis();
      const tweenAdd = vi.fn();

      const overlay = {
        destroy,
        fillRect,
        fillStyle,
        setDepth,
      };

      tweenAdd.mockImplementation(
        ({ onComplete }: { onComplete?: () => void }) => {
          onComplete?.();
        },
      );

      const scene = {
        add: {
          graphics: vi.fn(() => overlay),
        },
        cameras: {
          main: {
            width: 800,
            height: 600,
          },
        },
        tweens: {
          add: tweenAdd,
        },
      } as unknown as import("phaser").Scene;

      fadeIn(scene);

      expect(scene.add.graphics).toHaveBeenCalledTimes(1);
      expect(setDepth).toHaveBeenCalledWith(9999);
      expect(fillStyle).toHaveBeenCalledWith(0x000000, 1);
      expect(fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(tweenAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: overlay,
          alpha: 0,
          duration: 350,
        }),
      );
      expect(destroy).toHaveBeenCalledTimes(1);
    });
  });
});
