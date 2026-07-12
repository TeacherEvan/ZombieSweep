// @vitest-environment jsdom

// Must be imported BEFORE Phaser (GameScene) so the canvas prototype is patched
// at eval time; Phaser's device detection touches getContext('2d') on import.
import './../test/phaserJsdomStub';

import { describe, expect, it, vi } from 'vitest';

// Stub the visual feedback helpers so the real contact handlers can run
// headless without a real Phaser camera/render surface.
vi.mock('../utils/animations', () => ({
  screenShake: vi.fn(),
  damageFlash: vi.fn(),
  deathFlash: vi.fn(),
}));
vi.mock('../ui/ticker-bridge', () => ({
  headlineLifeLost: vi.fn(),
}));

import { GameScene } from './GameScene';
import { VehicleType } from '../config/vehicles';
import { VEHICLE_STATS } from '../config/vehicles';
import { GAME } from '../config/constants';
import { getOrCreateGameState } from '../systems/GameState';

// Regression test for the "instant death" bug: Phaser's physics.add.overlap
// fires onContact every frame while bodies intersect. Without an invuln window
// a single zombie touching the player drained all lives in ~3 frames.
//
// We drive the REAL handlers (onZombieContact / onHazardHit) on a real
// GameScene instance and assert that repeated overlap calls within a single
// invulnerability window only cost ONE life, then cost another only after the
// window elapses.

function makeScene(): GameScene {
  const scene = new GameScene();
  const gameState = getOrCreateGameState({
    get: () => undefined,
    set: () => {},
  });
  gameState.lives = GAME.STARTING_LIVES;
  gameState.vehicle = VehicleType.Bicycle;

  // Stub the visual feedback helpers so the real handler can run headless.
  (scene as unknown as { time: unknown }).time = {
    delayedCall: (_ms: number, cb: () => void) => {
      (scene as unknown as { __invulnTimer?: () => void }).__invulnTimer = cb;
      return { remove: vi.fn() };
    },
  };
  (scene as unknown as { gameState: typeof gameState }).gameState = gameState;

  // A minimal fake player the alpha fade touches.
  (scene as unknown as { player: unknown }).player = {
    setAlpha: vi.fn(),
    active: true,
  };

  // Stub the broadcast/HUD side effects invoked by the handlers.
  (scene as unknown as { transitioning: boolean }).transitioning = false;
  return scene;
}

function fakeZombieSprite() {
  return {
    getData: (key: string) => (key === 'zombie' ? { isDead: () => false } : undefined),
  } as unknown as Phaser.Types.Physics.Arcade.GameObjectWithBody;
}

function triggerZombieContact(scene: GameScene): void {
  const handler = (
    scene as unknown as {
      onZombieContact: (p: unknown, z: Phaser.Types.Physics.Arcade.GameObjectWithBody) => void;
    }
  ).onZombieContact;
  handler.call(
    scene,
    {} as unknown as Phaser.Types.Physics.Arcade.GameObjectWithBody,
    fakeZombieSprite()
  );
}

function triggerHazardHit(scene: GameScene): void {
  const handler = (
    scene as unknown as {
      onHazardHit: () => void;
    }
  ).onHazardHit;
  handler.call(scene);
}

function expireInvuln(scene: GameScene): void {
  const timer = (scene as unknown as { __invulnTimer?: () => void }).__invulnTimer;
  if (timer) timer();
}

describe('contact invulnerability window (instant-death regression)', () => {
  it('does not drain all lives from repeated zombie overlap in one window', () => {
    const scene = makeScene();
    const gs = (scene as unknown as { gameState: { lives: number } }).gameState;

    // 10 consecutive overlap frames while the player stays in contact.
    for (let i = 0; i < 10; i++) {
      triggerZombieContact(scene);
    }

    // Only ONE life lost despite 10 overlap firings.
    expect(gs.lives).toBe(GAME.STARTING_LIVES - 1);
  });

  it('costs a second life only after the invulnerability window elapses', () => {
    const scene = makeScene();
    const gs = (scene as unknown as { gameState: { lives: number } }).gameState;

    triggerZombieContact(scene);
    expect(gs.lives).toBe(GAME.STARTING_LIVES - 1);

    // Still inside the window: no further loss.
    triggerZombieContact(scene);
    triggerZombieContact(scene);
    expect(gs.lives).toBe(GAME.STARTING_LIVES - 1);

    // Window elapses -> next hit costs again.
    expireInvuln(scene);
    triggerZombieContact(scene);
    expect(gs.lives).toBe(GAME.STARTING_LIVES - 2);
  });

  it('hazard hits respect the same invulnerability window', () => {
    const scene = makeScene();
    const gs = (scene as unknown as { gameState: { lives: number } }).gameState;

    triggerHazardHit(scene);
    triggerHazardHit(scene);
    triggerHazardHit(scene);

    expect(gs.lives).toBe(GAME.STARTING_LIVES - 1);

    expireInvuln(scene);
    triggerHazardHit(scene);
    expect(gs.lives).toBe(GAME.STARTING_LIVES - 2);
  });

  it('invulnerability window scales with vehicle stability', () => {
    const stable = makeScene();
    (stable as unknown as { gameState: { vehicle: VehicleType } }).gameState.vehicle =
      VehicleType.Bicycle; // high stability
    const flimsy = makeScene();
    (flimsy as unknown as { gameState: { vehicle: VehicleType } }).gameState.vehicle =
      VehicleType.Skateboard; // low stability

    // Both should absorb the first hit, then block the immediate follow-up.
    triggerZombieContact(stable);
    triggerZombieContact(stable);
    triggerZombieContact(flimsy);
    triggerZombieContact(flimsy);

    const expectedStable = GAME.STARTING_LIVES - 1;
    const expectedFlimsy = GAME.STARTING_LIVES - 1;
    expect((stable as unknown as { gameState: { lives: number } }).gameState.lives).toBe(
      expectedStable
    );
    expect((flimsy as unknown as { gameState: { lives: number } }).gameState.lives).toBe(
      expectedFlimsy
    );
    // Sanity: both vehicle configs exist.
    expect(VEHICLE_STATS[VehicleType.Bicycle].stability).toBeGreaterThan(
      VEHICLE_STATS[VehicleType.Skateboard].stability
    );
  });
});
