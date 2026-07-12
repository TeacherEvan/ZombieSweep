// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { GameState } from './GameState';

// Regression tests for the LIVE adaptive-difficulty signal. The historical
// `accuracyHistory` path was already covered; this locks the in-run counters
// (liveThrows/liveHits/liveKills/liveHitsTaken) that GameScene now feeds so
// difficulty ramps during a day instead of only between days.
//
// Contract: with no live data the multiplier must stay exactly what the
// historical term alone produces (so existing callers/tests are unaffected).

describe('live adaptive difficulty (in-run)', () => {
  it('stays at the historical baseline when no live samples exist', () => {
    const gs = new GameState();
    gs.accuracyHistory = [];
    expect(gs.getAdaptiveMultiplier()).toBe(1.0);

    gs.accuracyHistory = [0.95, 0.92, 0.98];
    expect(gs.getAdaptiveMultiplier()).toBe(1.15);

    gs.accuracyHistory = [0.6, 0.5, 0.7];
    expect(gs.getAdaptiveMultiplier()).toBe(0.85);
  });

  it('is neutral with fewer than 3 throws (not enough samples)', () => {
    const gs = new GameState();
    gs.liveThrows = 2;
    gs.liveHits = 2; // 100% accuracy but too few throws
    gs.liveKills = 2;
    gs.liveHitsTaken = 0;
    expect(gs.getAdaptiveMultiplier()).toBe(1.0);
  });

  it('ramps UP when the player is dominating (high accuracy + clean kills)', () => {
    const gs = new GameState();
    gs.liveThrows = 10;
    gs.liveHits = 10; // 100% hit rate
    gs.liveKills = 10; // 10 kills, 0 hits taken
    gs.liveHitsTaken = 0;
    const m = gs.getAdaptiveMultiplier();
    expect(m).toBeGreaterThan(1.0);
  });

  it('eases OFF when the player is struggling (poor accuracy + taking hits)', () => {
    const gs = new GameState();
    gs.liveThrows = 10;
    gs.liveHits = 2; // 20% hit rate
    gs.liveKills = 1;
    gs.liveHitsTaken = 8; // getting mauled
    const m = gs.getAdaptiveMultiplier();
    expect(m).toBeLessThan(1.0);
  });

  it('combines with a historical baseline multiplicatively but stays clamped', () => {
    const gs = new GameState();
    gs.accuracyHistory = [0.95, 0.92, 0.98]; // history 1.15
    gs.liveThrows = 10;
    gs.liveHits = 10;
    gs.liveKills = 10;
    gs.liveHitsTaken = 0; // live 1.15
    const m = gs.getAdaptiveMultiplier();
    // 1.15 * 1.15 = 1.3225, clamped to 1.25
    expect(m).toBeLessThanOrEqual(1.25);
    expect(m).toBeGreaterThan(1.15);
  });

  it('counters reset on construction and full reset', () => {
    const gs = new GameState();
    gs.liveThrows = 5;
    gs.liveHits = 5;
    gs.liveKills = 5;
    gs.liveHitsTaken = 5;
    gs.reset();
    expect(gs.liveThrows).toBe(0);
    expect(gs.liveHits).toBe(0);
    expect(gs.liveKills).toBe(0);
    expect(gs.liveHitsTaken).toBe(0);
  });

  it('persists the live counters through localStorage round-trip', () => {
    const a = new GameState();
    a.liveThrows = 7;
    a.liveHits = 4;
    a.liveKills = 3;
    a.liveHitsTaken = 2;
    a.saveToLocalStorage();

    const b = new GameState();
    expect(b.loadFromLocalStorage()).toBe(true);
    expect(b.liveThrows).toBe(7);
    expect(b.liveHits).toBe(4);
    expect(b.liveKills).toBe(3);
    expect(b.liveHitsTaken).toBe(2);
  });
});
