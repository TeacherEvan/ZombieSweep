// @vitest-environment jsdom

// Must be imported BEFORE Phaser (GameScene) so the canvas prototype is patched
// at eval time; Phaser's device detection touches getContext('2d') on import.
import './../test/phaserJsdomStub';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GameScene } from './GameScene';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { HouseType } from '../entities/House';
import { VehicleType } from '../config/vehicles';

// The real FEATURE_FLAGS is `as const` (read-only). For the test we treat it as
// a mutable record so we can flip render3d on/off per case.
const flags = FEATURE_FLAGS as unknown as { render3d: boolean };

// ---------------------------------------------------------------------------
// Integration test for the GameScene <-> 3D Environment Bridge wiring.
//
// Phaser cannot run real headless scenes in this CI (no 2D canvas backend), so
// we exercise the actual wiring methods on a real `GameScene` instance while
// mocking the 3D modules (Render3DManager + createEnvironmentBridge). This
// proves the flag-OFF no-op guarantee and the flag-ON sync path end-to-end
// through the real GameScene code, not a reimplementation.
// ---------------------------------------------------------------------------

class FakeScene {
  children: unknown[] = [];
  add = (o: unknown) => this.children.push(o);
  remove = (o: unknown) => {
    this.children = this.children.filter(c => c !== o);
  };
  fog: unknown = null;
}
class FakeBridge {
  enabled = false;
  created = false;
  torn = false;
  updateArgs: unknown[] = [];
  /**
   * Counts how many times a mesh was *added* (createMesh path) across all
   * frames. If the bridge keyed correctly on a stable sprite, a steady set of
   * entities should add once, then stop — addCount should NOT grow every frame.
   */
  addCount = 0;
  setEnabled(v: boolean) {
    this.enabled = v;
  }
  create() {
    this.created = true;
  }
  update(a: unknown) {
    this.updateArgs.push(a);
  }
  teardown() {
    this.torn = true;
  }
}
class FakeEffectsBridge {
  enabled = false;
  created = false;
  torn = false;
  updateArgs: unknown[] = [];
  setEnabled(v: boolean) {
    this.enabled = v;
  }
  create() {
    this.created = true;
  }
  update(a: unknown) {
    this.updateArgs.push(a);
  }
  teardown() {
    this.torn = true;
  }
}
class FakeManager {
  scene = new FakeScene();
  cfg = { unitsPerPixel: 1, viewWidth: 960, viewHeight: 540 };
  created = false;
  torn = false;
  constructorCalls = 0;
  constructor() {
    this.constructorCalls++;
  }
  getScene() {
    return this.scene as never;
  }
  getConfig() {
    return this.cfg as never;
  }
  create() {
    this.created = true;
  }
  update() {
    /* render */
  }
  teardown() {
    this.torn = true;
  }
}

const managerSingleton = new FakeManager();
const bridgeSingleton = new FakeBridge();
const effectsSingleton = new FakeEffectsBridge();

vi.mock('../three/Render3DManager', () => ({
  Render3DManager: class {
    scene = new FakeScene();
    cfg = { unitsPerPixel: 1, viewWidth: 960, viewHeight: 540 };
    created = false;
    torn = false;
    constructor() {
      managerSingleton.constructorCalls++;
    }
    getScene() {
      // P4.3(c): when WebGL is simulated as unavailable, create() builds nothing.
      return webglUnavailable ? (null as never) : (this.scene as never);
    }
    getConfig() {
      return this.cfg as never;
    }
    create() {
      this.created = true;
      managerSingleton.created = true;
    }
    update() {}
    teardown() {
      this.torn = true;
      managerSingleton.torn = true;
    }
  },
}));

/** Toggled by the P4.3(c) test to simulate WebGL being unavailable. */
let webglUnavailable = false;
vi.mock('../three/bridges/EnvironmentBridge', () => ({
  createEnvironmentBridge: () => {
    return bridgeSingleton as never;
  },
}));
vi.mock('../three/bridges/EffectsBridge', () => ({
  createEffectsBridge: () => {
    return effectsSingleton as never;
  },
}));

/** Build a real GameScene with the fields the wiring touches stubbed. */
function makeScene(): GameScene {
  const scene = new GameScene();
  // Minimal camera surface used by the wiring.
  (scene as unknown as { cameras: { main: object } }).cameras = {
    main: {
      width: 960,
      height: 540,
      scrollX: 0,
      scrollY: 0,
      zoom: 1,
    },
  };
  // 2D house placements (public shape the bridge reads).
  const houses = [
    {
      house: { type: HouseType.Ranch },
      sprite: { x: 48, y: 68, visible: true, setVisible: vi.fn() },
    },
    {
      house: { type: HouseType.Colonial },
      sprite: { x: 912, y: 200, visible: true, setVisible: vi.fn() },
    },
  ];
  (scene as unknown as { houseSprites: unknown[] }).houseSprites = houses;
  (scene as unknown as { worldY: number }).worldY = 0;
  (scene as unknown as { newspaperSprites: { getChildren: () => unknown[] } }).newspaperSprites = {
    getChildren: () => [],
  };
  (scene as unknown as { zombieSprites: { getChildren: () => unknown[] } }).zombieSprites = {
    getChildren: () => [],
  };
  // Hazard wiring added by the visual overhaul reads hazardSprites every sync
  // frame once the env bridge exists.
  (scene as unknown as { hazardSprites: { getChildren: () => unknown[] } }).hazardSprites = {
    getChildren: () => [],
  };
  (scene as unknown as { render3d: unknown }).render3d = null;
  (scene as unknown as { envBridge: unknown }).envBridge = null;
  // effects wiring reads gameState.vehicle (VehicleType) when building the source.
  (scene as unknown as { gameState: { vehicle: VehicleType } }).gameState = {
    vehicle: VehicleType.Skateboard,
  };
  return scene;
}

describe('GameScene 3D Environment Bridge wiring', () => {
  beforeEach(() => {
    flags.render3d = false;
    webglUnavailable = false;
    managerSingleton.constructorCalls = 0;
    managerSingleton.created = false;
    managerSingleton.torn = false;
    bridgeSingleton.enabled = false;
    bridgeSingleton.created = false;
    bridgeSingleton.torn = false;
    bridgeSingleton.updateArgs = [];
    effectsSingleton.enabled = false;
    effectsSingleton.created = false;
    effectsSingleton.torn = false;
    effectsSingleton.updateArgs = [];
  });

  it('flag OFF: init/sync/teardown construct nothing and leave 2D untouched', () => {
    const scene = makeScene();
    const houses = (scene as unknown as { houseSprites: Array<{ sprite: { visible: boolean } }> })
      .houseSprites;

    scene.initRender3DLayer();
    scene.syncRender3DLayer(16);
    scene.destroyRender3DLayer();

    // No 3D objects were ever built.
    expect(managerSingleton.constructorCalls).toBe(0);
    expect(managerSingleton.created).toBe(false);
    expect(bridgeSingleton.created).toBe(false);
    expect(bridgeSingleton.updateArgs.length).toBe(0);
    expect(bridgeSingleton.torn).toBe(false);

    // The 2D layer is completely unchanged.
    expect((scene as unknown as { render3d: unknown }).render3d).toBeNull();
    expect((scene as unknown as { envBridge: unknown }).envBridge).toBeNull();
    expect(houses.every(h => h.sprite.visible === true)).toBe(true);
  });

  it('flag OFF: repeated update frames never reach the bridge', () => {
    const scene = makeScene();
    for (let i = 0; i < 10; i++) {
      scene.syncRender3DLayer(16);
    }
    expect(bridgeSingleton.updateArgs.length).toBe(0);
    expect(managerSingleton.constructorCalls).toBe(0);
  });

  it('flag ON: builds renderer + bridge, syncs houses, then tears down cleanly', () => {
    flags.render3d = true;
    const scene = makeScene();

    scene.initRender3DLayer();

    // Renderer + scene created, bridge enabled.
    expect(managerSingleton.constructorCalls).toBe(1);
    expect(managerSingleton.created).toBe(true);
    expect(bridgeSingleton.enabled).toBe(true);
    expect((scene as unknown as { envBridge: unknown }).envBridge).not.toBeNull();

    // First frame: houses pushed into the bridge.
    scene.syncRender3DLayer(16);
    expect(bridgeSingleton.updateArgs.length).toBe(1);
    const synced = bridgeSingleton.updateArgs[0] as {
      source: Array<{ houses: unknown[]; worldY: number }>;
    };
    expect(synced.source[0].houses.length).toBe(2);
    expect(synced.source[0].worldY).toBe(0);

    // (The 2D sprite hide is asserted by EnvironmentBridge.test.ts; here we
    // only verify the wiring pushes the correct source into the bridge.)

    // World scroll flows into the bridge on subsequent frames.
    (scene as unknown as { worldY: number }).worldY = 240;
    scene.syncRender3DLayer(16);
    const synced2 = bridgeSingleton.updateArgs[1] as {
      source: Array<{ worldY: number }>;
    };
    expect(synced2.source[0].worldY).toBe(240);

    // Shutdown tears everything down.
    scene.destroyRender3DLayer();
    expect(bridgeSingleton.torn).toBe(true);
    expect(managerSingleton.torn).toBe(true);
    expect((scene as unknown as { render3d: unknown }).render3d).toBeNull();
    expect((scene as unknown as { envBridge: unknown }).envBridge).toBeNull();
  });

  it('flag ON -> OFF regression: disabling the flag produces a 2D-only run', () => {
    flags.render3d = true;
    const onScene = makeScene();
    onScene.initRender3DLayer();
    onScene.syncRender3DLayer(16);
    onScene.destroyRender3DLayer();

    // Now simulate a fresh run with the flag toggled off (no restart needed —
    // the wiring must be inert regardless of prior 3D state).
    flags.render3d = false;
    const offScene = makeScene();
    offScene.initRender3DLayer();
    offScene.syncRender3DLayer(16);
    offScene.destroyRender3DLayer();

    expect((offScene as unknown as { render3d: unknown }).render3d).toBeNull();
    expect((offScene as unknown as { envBridge: unknown }).envBridge).toBeNull();
  });

  it('flag OFF: effects bridge is never created or synced (no-op)', () => {
    const scene = makeScene();
    scene.initRender3DLayer();
    scene.syncRender3DLayer(16);
    scene.destroyRender3DLayer();

    expect(effectsSingleton.created).toBe(false);
    expect(effectsSingleton.enabled).toBe(false);
    expect(effectsSingleton.updateArgs.length).toBe(0);
    expect(effectsSingleton.torn).toBe(false);
    expect((scene as unknown as { effectsBridge: unknown }).effectsBridge).toBeNull();
  });

  it('P4.3(c): WebGL unavailable → init is a no-op, 2D houses stay visible', () => {
    flags.render3d = true;
    webglUnavailable = true;
    const scene = makeScene();
    const houses = (scene as unknown as { houseSprites: Array<{ sprite: { visible: boolean } }> })
      .houseSprites;

    scene.initRender3DLayer();
    scene.syncRender3DLayer(16);
    scene.destroyRender3DLayer();

    // Manager was built but produced no scene, so no bridges were created/synced.
    expect(managerSingleton.constructorCalls).toBe(1);
    expect(bridgeSingleton.created).toBe(false);
    expect(bridgeSingleton.updateArgs.length).toBe(0);
    expect(effectsSingleton.created).toBe(false);

    // 2D render objects untouched — game remains fully playable.
    expect((scene as unknown as { render3d: unknown }).render3d).toBeNull();
    expect((scene as unknown as { envBridge: unknown }).envBridge).toBeNull();
    expect(houses.every(h => h.sprite.visible === true)).toBe(true);
  });

  it('flag ON: a steady entity set does not rebuild 3D meshes every frame (keyed reconciliation)', () => {
    flags.render3d = true;
    const scene = makeScene();
    // A single stable zombie sprite object (the kind Phaser keeps per entity).
    const stableZombieSprite = {
      getData: () => ({ type: 'Shambler', hp: 1, takeDamage() {}, isDead: () => false }),
      rotation: 0,
      visible: true,
      setVisible: vi.fn(),
    };
    (scene as unknown as { zombieSprites: { getChildren: () => unknown[] } }).zombieSprites = {
      getChildren: () => [stableZombieSprite],
    };
    scene.initRender3DLayer();

    // Capture the sprite object the GameScene wiring passes into the bridge
    // each frame. With the keyed-reconciliation fix it must be the SAME
    // stable sprite reference across frames (a fresh wrapper would thrash).
    const captured: unknown[] = [];
    const realBridge = (scene as unknown as { zombieBridge: { update: (a: unknown) => void } })
      .zombieBridge;
    const origUpdate = realBridge.update.bind(realBridge);
    realBridge.update = (a: unknown) => {
      const src = (a as { source: Array<{ sprite: unknown }> }).source;
      captured.push(src?.[0]?.sprite);
      return origUpdate(a);
    };

    scene.syncRender3DLayer(16);
    scene.syncRender3DLayer(16);

    // Same stable sprite passed both frames → bridge key is stable → no rebuild.
    expect(captured[0]).toBe(stableZombieSprite);
    expect(captured[1]).toBe(stableZombieSprite);
    expect(captured[0]).toBe(captured[1]);

    scene.destroyRender3DLayer();
    expect((scene as unknown as { zombieBridge: unknown }).zombieBridge).toBeNull();
  });

  it('flag ON: effects bridge built, enabled, and receives projectiles + combo tier', () => {
    flags.render3d = true;
    const scene = makeScene();
    // Give the scene live newspaper projectiles to read.
    const np = { x: 300, y: 150, angle: 45 };
    (scene as unknown as { newspaperSprites: { getChildren: () => unknown[] } }).newspaperSprites =
      {
        getChildren: () => [np],
      };

    scene.initRender3DLayer();
    expect(effectsSingleton.created).toBe(true);
    expect(effectsSingleton.enabled).toBe(true);
    expect((scene as unknown as { effectsBridge: unknown }).effectsBridge).not.toBeNull();

    // Drive a Spitter kill to populate the acid buffer + buffered kill event.
    const onKill = scene as unknown as {
      pendingKillEvents: Array<{ x: number; y: number; intensity: number }>;
      pendingAcidEvents: Array<{ x: number; y: number }>;
      lastComboTier: number;
    };
    onKill.pendingKillEvents.push({ x: 480, y: 270, intensity: 1 });
    onKill.pendingAcidEvents.push({ x: 480, y: 270 });
    onKill.lastComboTier = 3;

    scene.syncRender3DLayer(16);
    expect(effectsSingleton.updateArgs.length).toBe(1);
    const synced = effectsSingleton.updateArgs[0] as {
      source: Array<{
        projectiles: unknown[];
        killEvents: unknown[];
        acidEvents: unknown[];
        comboTier: number;
      }>;
    };
    expect(synced.source[0].projectiles.length).toBe(1);
    expect(synced.source[0].killEvents.length).toBe(1);
    expect(synced.source[0].acidEvents.length).toBe(1);
    expect(synced.source[0].comboTier).toBe(3);

    scene.destroyRender3DLayer();
    expect(effectsSingleton.torn).toBe(true);
    expect((scene as unknown as { effectsBridge: unknown }).effectsBridge).toBeNull();
  });
});
