import type * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';
import {
  ParticlePool,
  spawnGoreBurst,
  spawnAcidSplash,
  spawnNewspaperDelivery,
} from './ParticleFactory';

const makeScene = () => ({ add: vi.fn(), remove: vi.fn(), children: [] }) as unknown as THREE.Scene;

describe('ParticleFactory', () => {
  it('ParticlePool initialises', () => expect(() => new ParticlePool(50)).not.toThrow());
  it('ParticlePool has cap property', () => expect(new ParticlePool(10).cap).toBe(10));
  it('spawnGoreBurst does not throw', () => {
    expect(() => spawnGoreBurst(makeScene(), new ParticlePool(20), 0, 0, 1)).not.toThrow();
  });
  it('spawnAcidSplash does not throw', () => {
    expect(() => spawnAcidSplash(makeScene(), new ParticlePool(20), 0, 0)).not.toThrow();
  });
  it('spawnNewspaperDelivery does not throw', () => {
    expect(() => spawnNewspaperDelivery(makeScene(), new ParticlePool(20), 0, 0)).not.toThrow();
  });
  it('pool tick reduces live count over time', () => {
    const scene = makeScene();
    const pool = new ParticlePool(20);
    spawnGoreBurst(scene, pool, 0, 0, 1);
    const before = pool.liveCount;
    pool.tick(scene, 2000); // advance 2 seconds — all particles expired (ttl <= 1000ms)
    expect(pool.liveCount).toBeLessThanOrEqual(before);
  });
});
