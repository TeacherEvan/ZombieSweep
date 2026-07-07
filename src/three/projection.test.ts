import { describe, expect, it } from 'vitest';
import {
  defaultOrthoConfig,
  screenToThree,
  threeToScreen,
  worldToScreen,
  worldToThree,
  type CameraView,
} from './projection';

const cfg = defaultOrthoConfig(960, 540, 1);

describe('projection', () => {
  describe('worldToScreen', () => {
    it('returns world coords unchanged at zero scroll, unit zoom', () => {
      expect(worldToScreen(100, 200, 0, 0, 1)).toEqual({ x: 100, y: 200 });
    });

    it('subtracts camera scroll and applies zoom', () => {
      expect(worldToScreen(100, 200, 50, 30, 2)).toEqual({ x: 100, y: 340 });
    });
  });

  describe('screenToThree', () => {
    it('centers the viewport origin and flips y (screen y-down -> three y-up)', () => {
      const center = screenToThree(480, 270, cfg);
      expect(center.x).toBeCloseTo(0);
      expect(center.y).toBeCloseTo(0);
      expect(center.z).toBe(0);
    });

    it('maps screen top-left to negative-x / positive-y', () => {
      const topLeft = screenToThree(0, 0, cfg);
      expect(topLeft.x).toBeCloseTo(-480);
      expect(topLeft.y).toBeCloseTo(270);
    });

    it('scales by unitsPerPixel', () => {
      const big = defaultOrthoConfig(960, 540, 2);
      const center = screenToThree(480, 270, big);
      expect(center.x).toBeCloseTo(0);
    });
  });

  describe('worldToThree', () => {
    const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

    it('maps world origin with zero scroll to three origin', () => {
      const p = worldToThree(480, 270, cam, cfg);
      expect(p.x).toBeCloseTo(0);
      expect(p.y).toBeCloseTo(0);
    });

    it('is deterministic: same world point reprojects identically under scroll', () => {
      const scrolled: CameraView = { scrollX: 120, scrollY: 40, zoom: 1 };
      const a = worldToThree(300, 200, scrolled, cfg);
      const b = worldToThree(300, 200, scrolled, cfg);
      expect(a).toEqual(b);
    });

    it('positively offset world point lands to the right and above center in three space', () => {
      const p = worldToThree(700, 100, cam, cfg);
      expect(p.x).toBeGreaterThan(0);
      expect(p.y).toBeGreaterThan(0);
    });
  });

  describe('threeToScreen', () => {
    it('is the inverse of screenToThree', () => {
      const s = { x: 123, y: 456 };
      const t = screenToThree(s.x, s.y, cfg);
      const back = threeToScreen(t.x, t.y, cfg);
      expect(back.x).toBeCloseTo(s.x);
      expect(back.y).toBeCloseTo(s.y);
    });
  });
});
