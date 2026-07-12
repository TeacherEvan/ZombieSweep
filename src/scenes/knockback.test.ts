// @vitest-environment jsdom

// Must be imported BEFORE Phaser (GameScene) so the canvas prototype is patched
// at eval time; Phaser's device detection touches getContext('2d') on import.
import './../test/phaserJsdomStub';

import { describe, expect, it, vi } from 'vitest';

import { GameScene } from './GameScene';

// Regression test for "weapon knockback is dead weight": every weapon/vehicle
// config defined a `knockback` stat that was never consumed. Zombies re-homed
// the player every frame via moveToObject, so hits felt weightless. We now
// apply an impulse + a stagger window on melee/ranged hits. This test drives
// the REAL private handlers (applyKnockback / isZombieStaggered) on a real
// GameScene instance and asserts the impulse lands away from the player,
// elites shrug off more of it, and the stagger window gates the homing skip.

function makeScene(now = 1000): GameScene {
  const scene = new GameScene();
  const time = { now };
  (scene as unknown as { time: { now: number } }).time = time;
  // Player sits at its in-game spawn (480, 450) so knockback direction math works.
  (scene as unknown as { player: { x: number; y: number } }).player = { x: 480, y: 450 };
  return scene;
}

function fakeZombieSprite(opts: { elite?: boolean; x?: number; y?: number } = {}) {
  const x = opts.x ?? 600;
  const y = opts.y ?? 300;
  const data: Record<string, unknown> = {
    zombieRenderState: opts.elite ? { elite: true } : { elite: false },
  };
  const setVelocity = vi.fn();
  return {
    x,
    y,
    body: { setVelocity },
    getData: (key: string) => data[key],
    setData: (key: string, value: unknown) => {
      data[key] = value;
    },
    _setVelocity: setVelocity,
    _readStagger: () => staggerUntil,
    __data: data,
  } as unknown as Phaser.Physics.Arcade.Sprite & {
    _setVelocity: ReturnType<typeof vi.fn>;
    __data: Record<string, unknown>;
  };
}

function applyKnockback(scene: GameScene, sprite: unknown, knockback: number): void {
  (
    scene as unknown as {
      applyKnockback: (s: Phaser.Physics.Arcade.Sprite, k: number) => void;
    }
  ).applyKnockback.call(scene, sprite as Phaser.Physics.Arcade.Sprite, knockback);
}

function isZombieStaggered(scene: GameScene, sprite: unknown): boolean {
  return (
    scene as unknown as {
      isZombieStaggered: (s: Phaser.Physics.Arcade.Sprite) => boolean;
    }
  ).isZombieStaggered.call(scene, sprite as Phaser.Physics.Arcade.Sprite);
}

describe('weapon knockback + stagger (dead-stat wiring)', () => {
  it('applies an impulse that pushes the zombie AWAY from the player', () => {
    const scene = makeScene();
    // Player sits at (480, 450) in create(); place zombie to the right of it.
    const sprite = fakeZombieSprite({ x: 600, y: 450 });
    applyKnockback(scene, sprite, 3);

    const setVelocity = (sprite as unknown as { _setVelocity: ReturnType<typeof vi.fn> })
      ._setVelocity;
    expect(setVelocity).toHaveBeenCalledTimes(1);
    const [vx] = setVelocity.mock.calls[0];
    // Zombie is to the right of the player -> impulse velocity.x must be > 0.
    expect(vx).toBeGreaterThan(0);
  });

  it('records a stagger window after a hit', () => {
    const scene = makeScene(1000);
    const sprite = fakeZombieSprite({ x: 600, y: 450 });
    applyKnockback(scene, sprite, 3);

    expect(isZombieStaggered(scene, sprite)).toBe(true);
    const data = (sprite as unknown as { __data: Record<string, unknown> }).__data;
    expect(typeof data['staggerUntil']).toBe('number');
    expect(data['staggerUntil']).toBeGreaterThan(1000);
  });

  it('stagger clears after the window elapses', () => {
    const scene = makeScene(1000);
    const sprite = fakeZombieSprite({ x: 600, y: 450 });
    applyKnockback(scene, sprite, 3);

    // Advance scene clock past the stagger window.
    (scene as unknown as { time: { now: number } }).time.now = 1000 + 2000;
    expect(isZombieStaggered(scene, sprite)).toBe(false);
  });

  it('elites receive a smaller impulse than normal zombies for equal knockback', () => {
    const scene = makeScene();
    const normal = fakeZombieSprite({ x: 600, y: 450, elite: false });
    const elite = fakeZombieSprite({ x: 600, y: 450, elite: true });

    applyKnockback(scene, normal, 3);
    applyKnockback(scene, elite, 3);

    const normalVx = (normal as unknown as { _setVelocity: ReturnType<typeof vi.fn> })._setVelocity
      .mock.calls[0][0] as number;
    const eliteVx = (elite as unknown as { _setVelocity: ReturnType<typeof vi.fn> })._setVelocity
      .mock.calls[0][0] as number;

    expect(eliteVx).toBeLessThan(normalVx);
    expect(eliteVx).toBeGreaterThan(0);
  });

  it('does nothing when knockback is zero', () => {
    const scene = makeScene();
    const sprite = fakeZombieSprite({ x: 600, y: 450 });
    applyKnockback(scene, sprite, 0);

    const setVelocity = (sprite as unknown as { _setVelocity: ReturnType<typeof vi.fn> })
      ._setVelocity;
    expect(setVelocity).not.toHaveBeenCalled();
    expect(isZombieStaggered(scene, sprite)).toBe(false);
  });
});
