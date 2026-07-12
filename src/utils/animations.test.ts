import { describe, it, expect, vi } from 'vitest';
import type { Scene } from 'phaser';
import { STATION_BREAK, fadeIn, hitFlash, prefersReducedMotion } from './animations';

// Mock Phaser — its module-level init requires `window` which doesn't exist in Node
vi.mock('phaser', () => ({ default: {} }));

describe('animations', () => {
  describe('STATION_BREAK config', () => {
    it('should define wipe-in duration in ms', () => {
      expect(STATION_BREAK.WIPE_IN_MS).toBe(250);
    });

    it('should define hold duration in ms', () => {
      expect(STATION_BREAK.HOLD_MS).toBe(200);
    });

    it('should define overlay depth above all game content', () => {
      expect(STATION_BREAK.DEPTH).toBeGreaterThanOrEqual(999);
    });

    it('should define red accent bar height in px', () => {
      expect(STATION_BREAK.BAR_HEIGHT).toBe(6);
    });

    it('should define station ID text', () => {
      expect(STATION_BREAK.STATION_ID).toBe('WZMB 13');
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false when window is undefined (SSR/node)', () => {
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('fadeIn', () => {
    it('should add a full-screen overlay and destroy it after the tween completes', () => {
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

      tweenAdd.mockImplementation(({ onComplete }: { onComplete?: () => void }) => {
        onComplete?.();
      });

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
      } as unknown as Scene;

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
        })
      );
      expect(destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('hitFlash', () => {
    function makeSprite(baseScale = 1) {
      return {
        scaleX: baseScale,
        scaleY: baseScale,
        setTint: vi.fn(),
        clearTint: vi.fn(),
        setScale: vi.fn(),
      };
    }

    it('applies a tint, pops scale to 1.25×, and resets on complete', () => {
      const sprite = makeSprite(1);
      const tweenAdd = vi.fn(({ onComplete }: { onComplete?: () => void }) => {
        onComplete?.();
      });
      const scene = {
        tweens: { add: tweenAdd },
      } as unknown as Scene;

      hitFlash(scene, sprite as never);

      expect(sprite.setTint).toHaveBeenCalledWith(0xffffff);
      expect(tweenAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: sprite,
          scaleX: 1.25,
          scaleY: 1.25,
          yoyo: true,
          duration: 70,
        })
      );
      // onComplete resets scale + clears tint
      expect(sprite.setScale).toHaveBeenCalledWith(1, 1);
      expect(sprite.clearTint).toHaveBeenCalledTimes(1);
    });

    it("scales relative to the sprite's current scale", () => {
      const sprite = makeSprite(2);
      const tweenAdd = vi.fn(({ onComplete }: { onComplete?: () => void }) => {
        onComplete?.();
      });
      const scene = { tweens: { add: tweenAdd } } as unknown as Scene;

      hitFlash(scene, sprite as never);

      expect(tweenAdd).toHaveBeenCalledWith(expect.objectContaining({ scaleX: 2.5, scaleY: 2.5 }));
      expect(sprite.setScale).toHaveBeenCalledWith(2, 2);
    });

    it('is a no-op under prefers-reduced-motion (no tint, no tween)', () => {
      const sprite = makeSprite(1);
      const tweenAdd = vi.fn();
      const scene = { tweens: { add: tweenAdd } } as unknown as Scene;
      const origWindow = globalThis.window;
      // @ts-expect-error - test shim
      globalThis.window = {
        matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
      };

      hitFlash(scene, sprite as never);

      expect(sprite.setTint).not.toHaveBeenCalled();
      expect(tweenAdd).not.toHaveBeenCalled();

      globalThis.window = origWindow;
    });
  });
});
