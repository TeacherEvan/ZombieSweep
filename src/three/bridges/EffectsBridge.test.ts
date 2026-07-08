import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createEffectsBridge,
  comboLightIntensity,
  PARTICLE_POOL_CAP,
  type EffectsBridgeSource,
  type ProjectileSourceItem,
  type KillEvent,
} from './EffectsBridge';
import { VehicleType } from '../../config/vehicles';
import { defaultOrthoConfig, worldToThree, type CameraView } from '../projection';
import { depthZOffset } from '../depthBand';

const cfg = defaultOrthoConfig(960, 540, 1);
const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

function projectile(x: number, y: number, angle = 0): ProjectileSourceItem {
  return { x, y, angle };
}

function kill(x: number, y: number, intensity = 1): KillEvent {
  return { x, y, intensity };
}

function makeSource(partial: Partial<EffectsBridgeSource> = {}): EffectsBridgeSource {
  return {
    projectiles: partial.projectiles ?? [],
    killEvents: partial.killEvents ?? [],
    acidEvents: partial.acidEvents ?? [],
    comboTier: partial.comboTier ?? 0,
    vehicleType: partial.vehicleType,
  };
}

describe('comboLightIntensity (pure mapping)', () => {
  it('tier 0 emits no light', () => {
    expect(comboLightIntensity(0)).toBe(0);
  });
  it('scales up with tier and is capped', () => {
    expect(comboLightIntensity(1)).toBeGreaterThan(0);
    expect(comboLightIntensity(5)).toBeGreaterThan(comboLightIntensity(2));
    expect(comboLightIntensity(100)).toBeLessThanOrEqual(2);
  });
});

describe('EffectsBridge — projectiles (P3.1)', () => {
  it('adds one projectile mesh per source item, reprojected to 2D parity', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    const src = makeSource({ projectiles: [projectile(480, 270, Math.PI / 4)] });
    bridge.update({ source: [src], host: scene, cam });

    expect(bridge.getProjectileCount()).toBe(1);
    const mesh = bridge.getProjectileMeshes()[0];
    const expected = worldToThree(480, 270, cam, cfg);
    expect(mesh.position.x).toBeCloseTo(expected.x);
    // z includes the projectile depth band offset (P4.1) for ortho occlusion.
    expect(mesh.position.z).toBeCloseTo(expected.z + depthZOffset('projectile'));
    expect(mesh.rotation.y).toBeCloseTo(Math.PI / 4);
  });

  it('grows and shrinks projectile meshes to match live source count', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ projectiles: [projectile(10, 10), projectile(20, 20)] })],
      host: scene,
      cam,
    });
    expect(bridge.getProjectileCount()).toBe(2);
    bridge.update({
      source: [makeSource({ projectiles: [projectile(10, 10)] })],
      host: scene,
      cam,
    });
    expect(bridge.getProjectileCount()).toBe(1);
  });

  it('uses vehicle-appropriate mesh when vehicleType is specified', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    const src = makeSource({ projectiles: [projectile(480, 270, 0)] });
    src.vehicleType = VehicleType.Bicycle;
    bridge.update({ source: [src], host: scene, cam });

    expect(bridge.getProjectileCount()).toBe(1);
    const mesh = bridge.getProjectileMeshes()[0];
    expect(mesh).toBeInstanceOf(THREE.Group);
    expect(mesh.children.find(c => c.name === 'roll')).toBeDefined();
  });
});

describe('EffectsBridge — death bursts (P3.2)', () => {
  it('spawns gore particles for each kill event', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ killEvents: [kill(100, 100, 1), kill(200, 200, 1)] })],
      host: scene,
      cam,
    });
    // 2 kills * round(5*1) = 10 particles active.
    expect(bridge.getActiveParticleCount()).toBe(10);
  });

  it('elite kills spawn more particles than normal kills', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ killEvents: [kill(100, 100, 1.6)] })],
      host: scene,
      cam,
    });
    // round(5 * 1.6) = 8.
    expect(bridge.getActiveParticleCount()).toBe(8);
  });

  it('recycles particles back into the pool after their lifetime', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({ source: [makeSource({ killEvents: [kill(100, 100, 1)] })], host: scene, cam });
    expect(bridge.getActiveParticleCount()).toBe(5);
    // Advance past particle lifetime (life ~300ms); bursts should be recycled.
    bridge.update({ source: [makeSource()], host: scene, cam, dt: 400 });
    expect(bridge.getActiveParticleCount()).toBe(0);
    // Pool reused, not disposed: spawning again needs no new allocation.
    bridge.update({ source: [makeSource({ killEvents: [kill(300, 300, 1)] })], host: scene, cam });
    expect(bridge.getActiveParticleCount()).toBe(5);
  });
});

describe('EffectsBridge — hard perf cap (P3.4)', () => {
  it('never exceeds the particle pool cap even under a kill flood', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    // 100 elite kills: 100 * 8 = 800 requested, must clamp to PARTICLE_POOL_CAP.
    const floods: KillEvent[] = [];
    for (let i = 0; i < 100; i++) floods.push(kill(i, i, 1.6));
    bridge.update({ source: [makeSource({ killEvents: floods })], host: scene, cam });
    expect(bridge.getActiveParticleCount()).toBeLessThanOrEqual(PARTICLE_POOL_CAP);
    expect(PARTICLE_POOL_CAP).toBeGreaterThan(0);
    expect(bridge.getActiveParticleCount()).toBe(PARTICLE_POOL_CAP);
  });
});

describe('EffectsBridge — combo light pulse (P3.3)', () => {
  it('adds a combo light to the scene only when a combo is active', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({ source: [makeSource({ comboTier: 0 })], host: scene, cam });
    expect(bridge.getComboLight()?.intensity ?? 0).toBe(0);

    bridge.update({ source: [makeSource({ comboTier: 3 })], host: scene, cam });
    expect(bridge.getComboLight()).not.toBeNull();
    expect(bridge.getComboLight().intensity).toBeGreaterThan(0);
  });
});

describe('EffectsBridge — reduced-motion (Global Constraint)', () => {
  it('skips heavy gore/particle bursts under reduced motion', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg, true); // reducedMotion = true
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ killEvents: [kill(100, 100, 1), kill(200, 200, 1)] })],
      host: scene,
      cam,
    });
    // Plan: "Reduced-motion path must skip heavy particle effects."
    expect(bridge.getActiveParticleCount()).toBe(0);
    // Combo light still pulses (dimmed) for feedback.
    bridge.update({ source: [makeSource({ comboTier: 3 })], host: scene, cam });
    expect(bridge.getComboLight().intensity).toBeGreaterThan(0);
  });

  it('spawns gore under normal motion', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg, false);
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ killEvents: [kill(100, 100, 1)] })],
      host: scene,
      cam,
    });
    expect(bridge.getActiveParticleCount()).toBe(5);
  });
});

describe('EffectsBridge — Spitter acid-sac bursts', () => {
  it('spawns acid particles for each Spitter death (reuses the same pool)', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg, false);
    bridge.setEnabled(true);
    bridge.update({
      source: [
        makeSource({
          acidEvents: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
        }),
      ],
      host: scene,
      cam,
    });
    // 2 spitter deaths * 5 acid particles = 10 active.
    expect(bridge.getActiveParticleCount()).toBe(10);
  });

  it('skips acid particles under reduced motion', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg, true);
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ acidEvents: [{ x: 100, y: 100 }] })],
      host: scene,
      cam,
    });
    expect(bridge.getActiveParticleCount()).toBe(0);
  });
});

describe('EffectsBridge — disabled / teardown', () => {
  it('releases all meshes and clears particles when disabled', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({
      source: [
        makeSource({
          projectiles: [projectile(10, 10)],
          killEvents: [kill(50, 50, 1)],
          comboTier: 2,
        }),
      ],
      host: scene,
      cam,
    });
    expect(bridge.getProjectileCount()).toBe(1);
    expect(bridge.getActiveParticleCount()).toBe(5);

    bridge.setEnabled(false);
    bridge.update({ source: [makeSource()], host: scene, cam });
    expect(bridge.getProjectileCount()).toBe(0);
    expect(bridge.getActiveParticleCount()).toBe(0);
    expect(bridge.getComboLight()?.intensity ?? 0).toBe(0);
  });

  it('teardown disposes pools, removes combo light, and resets enabled', () => {
    const scene = new THREE.Scene();
    const bridge = createEffectsBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({
      source: [makeSource({ projectiles: [projectile(10, 10)], killEvents: [kill(50, 50, 1)] })],
      host: scene,
      cam,
    });
    bridge.teardown();
    expect(bridge.getProjectileCount()).toBe(0);
    expect(bridge.getActiveParticleCount()).toBe(0);
    expect(bridge.isEnabled()).toBe(false);
  });
});
