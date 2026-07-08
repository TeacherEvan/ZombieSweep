import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createEnvironmentBridge, type HouseSourceItem } from './bridges/EnvironmentBridge';
import {
  createEffectsBridge,
  type EffectsBridgeSource,
  type KillEvent,
  PARTICLE_POOL_CAP,
} from './bridges/EffectsBridge';
import { PlayerBridge, type PlayerSourceItem } from './bridges/PlayerBridge';
import { ZombieBridge, type ZombieSourceItem } from './bridges/ZombieBridge';
import { ZombieType } from '../entities/Zombie';
import { VehicleType } from '../config/vehicles';
import { defaultOrthoConfig, type CameraView } from './projection';
import { HouseType } from '../entities/House';

// ---------------------------------------------------------------------------
// Headless perf guard (design P5.2).
//
// No WebGL context is needed — these exercise the REAL bridge sync logic
// (projection math, mesh reconciliation, particle pool, combo light) against
// actual THREE objects, which is where per-frame cost lives. A regression that
// allocates per frame or blows up the particle pool would surface here as a
// time or count breach, caught in CI without a GPU.
//
// Budget is deliberately generous for a cold, non-GPU run; the intent is to
// flag gross regressions (e.g. O(n^2) sync, per-frame allocation storms),
// not to micro-benchmark the renderer.
// ---------------------------------------------------------------------------

const cfg = defaultOrthoConfig(960, 540, 1);
const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

const HOUSE_COUNT = 40;
const PROJECTILE_COUNT = 30;
const ZOMBIE_COUNT = 30;

function makeHouses(): HouseSourceItem[] {
  const houses: HouseSourceItem[] = [];
  for (let i = 0; i < HOUSE_COUNT; i++) {
    houses.push({
      house: { type: HouseType.Ranch },
      sprite: {
        x: (i * 24) % 960,
        y: 100 + (i % 5) * 40,
        visible: true,
        setVisible: () => {},
      },
    });
  }
  return houses;
}

function makeEffectsSource(kills: KillEvent[] = []): EffectsBridgeSource {
  const projectiles = Array.from({ length: PROJECTILE_COUNT }, (_, i) => ({
    x: i * 30,
    y: 200,
    angle: (i * Math.PI) / 8,
  }));
  return { projectiles, killEvents: kills, comboTier: 4 };
}

function makeZombies(): ZombieSourceItem[] {
  const zombies: ZombieSourceItem[] = [];
  for (let i = 0; i < ZOMBIE_COUNT; i++) {
    zombies.push({
      type: ZombieType.Shambler,
      elite: i % 5 === 0,
      sprite: {
        x: (i * 32) % 960,
        y: 200 + (i % 4) * 30,
        rotation: (i * Math.PI) / 6,
        visible: true,
        setVisible: () => {},
      },
    });
  }
  return zombies;
}

describe('3D bridge perf guard (headless, no GPU)', () => {
  it('environment + effects + player + zombie sync stays within frame budget across 300 frames', () => {
    const scene = new THREE.Scene();
    const env = createEnvironmentBridge(scene, cfg);
    env.setEnabled(true);
    const fx = createEffectsBridge(scene, cfg);
    fx.setEnabled(true);
    const player = new PlayerBridge(scene, cfg);
    player.setEnabled(true);
    const zombie = new ZombieBridge(scene, cfg);
    zombie.setEnabled(true);

    const envSource = [{ houses: makeHouses(), worldY: 0 }];
    const fxSource = makeEffectsSource([{ x: 480, y: 270, intensity: 1 }]);
    const playerSource: PlayerSourceItem[] = [
      {
        vehicle: VehicleType.Skateboard,
        sprite: {
          x: 480,
          y: 270,
          rotation: 0.1,
          scaleX: 1,
          visible: true,
          setVisible: () => {},
        },
      },
    ];
    const zombieSource = makeZombies();

    const FRAMES = 300;
    const start = performance.now();
    for (let f = 0; f < FRAMES; f++) {
      envSource[0].worldY = f * 4; // scroll the route
      env.update({ source: envSource, host: scene, cam });
      fx.update({ source: [fxSource], host: scene, cam, dt: 16 });
      player.update({ source: playerSource, host: scene, cam });
      zombie.update({ source: zombieSource, host: scene, cam, dt: 16 });
    }
    const elapsed = performance.now() - start;
    const perFrame = elapsed / FRAMES;

    // Budget: 300 frames of full sync under ~1ms each in a cold JS run.
    expect(perFrame).toBeLessThan(1.0);
  });

  it('effects particle pool never exceeds the hard cap even under sustained kills', () => {
    const scene = new THREE.Scene();
    const fx = createEffectsBridge(scene, cfg);
    fx.setEnabled(true);
    const base = makeEffectsSource();

    // Every frame spawns a flood, but the cap must clamp live particles.
    for (let f = 0; f < 60; f++) {
      const floods: KillEvent[] = [];
      for (let i = 0; i < 50; i++) floods.push({ x: i, y: i, intensity: 1.6 });
      fx.update({ source: [makeEffectsSource(floods)], host: scene, cam, dt: 16 });
    }
    expect(fx.getActiveParticleCount()).toBeLessThanOrEqual(PARTICLE_POOL_CAP);
    // And total live meshes (projectiles + particles) stay bounded.
    expect(fx.getProjectileCount()).toBe(PROJECTILE_COUNT);
    void base;
  });
});
