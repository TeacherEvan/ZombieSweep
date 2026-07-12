import { beforeEach, describe, expect, it } from 'vitest';
import { ComboTracker } from './ComboTracker';

describe('ComboTracker', () => {
  let tracker: ComboTracker;

  beforeEach(() => {
    tracker = new ComboTracker();
  });

  describe('registerKill', () => {
    it('first kill is not a combo', () => {
      const result = tracker.registerKill(1000);
      expect(result.comboCount).toBe(1);
      expect(result.isCombo).toBe(false);
    });

    it('second kill within 2s is a 2× combo', () => {
      tracker.registerKill(1000);
      const result = tracker.registerKill(2500);
      expect(result.comboCount).toBe(2);
      expect(result.isCombo).toBe(true);
    });

    it('third kill within window is a 3× combo', () => {
      tracker.registerKill(1000);
      tracker.registerKill(2000);
      const result = tracker.registerKill(3000);
      expect(result.comboCount).toBe(3);
      expect(result.isCombo).toBe(true);
    });

    it('kill after 2s gap resets combo to 1', () => {
      tracker.registerKill(1000);
      tracker.registerKill(2000);
      const result = tracker.registerKill(5000);
      expect(result.comboCount).toBe(1);
      expect(result.isCombo).toBe(false);
    });

    it('kill at exactly 2000ms boundary is still a combo', () => {
      tracker.registerKill(1000);
      const result = tracker.registerKill(3000);
      expect(result.comboCount).toBe(2);
      expect(result.isCombo).toBe(true);
    });

    it('kill at 2001ms past boundary resets', () => {
      tracker.registerKill(1000);
      const result = tracker.registerKill(3001);
      expect(result.comboCount).toBe(1);
      expect(result.isCombo).toBe(false);
    });
  });

  describe('resetCombo', () => {
    it('resets combo count to zero', () => {
      tracker.registerKill(1000);
      tracker.registerKill(2000);
      tracker.resetCombo();
      const result = tracker.registerKill(10000);
      expect(result.comboCount).toBe(1);
      expect(result.isCombo).toBe(false);
    });
  });

  describe('render state (HUD timer bar)', () => {
    it('exposes window size and count', () => {
      expect(tracker.windowMs).toBe(2000);
      expect(tracker.count).toBe(0);
      tracker.registerKill(1000);
      expect(tracker.count).toBe(1);
      tracker.registerKill(1500);
      expect(tracker.count).toBe(2);
    });

    it('reports full remaining time right after a kill', () => {
      tracker.registerKill(5000);
      expect(tracker.remainingMs(5000)).toBe(2000);
      expect(tracker.isActive(5000)).toBe(true);
    });

    it('drains remaining time and becomes inactive after the window', () => {
      tracker.registerKill(5000);
      expect(tracker.remainingMs(6000)).toBe(1000);
      expect(tracker.isActive(6000)).toBe(true);
      expect(tracker.remainingMs(7001)).toBe(0);
      expect(tracker.isActive(7001)).toBe(false);
    });

    it('reports no active combo when idle', () => {
      expect(tracker.isActive(1234)).toBe(false);
      expect(tracker.remainingMs(1234)).toBe(0);
    });
  });
});
