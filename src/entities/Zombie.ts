import {
  POINTS,
  ZOMBIE_DAMAGE,
  ZOMBIE_HP,
  ZOMBIE_SPEED,
} from "../config/constants";

export enum ZombieType {
  Shambler = "Shambler",
  Runner = "Runner",
  Spitter = "Spitter",
}

export interface Zombie {
  type: ZombieType;
  x: number;
  y: number;
  hp: number;
  speed: number;
  damage: number;
  basePoints: number;
  isRanged: boolean;
  takeDamage(amount: number): void;
  isDead(): boolean;
}

function createZombie(
  type: ZombieType,
  x: number,
  y: number,
  hp: number,
  speed: number,
  damage: number,
  basePoints: number,
  isRanged: boolean,
): Zombie {
  return {
    type,
    x,
    y,
    hp,
    speed,
    damage,
    basePoints,
    isRanged,
    takeDamage(amount: number) {
      this.hp = Math.max(0, this.hp - amount);
    },
    isDead() {
      return this.hp <= 0;
    },
  };
}

export function createShambler(x: number, y: number): Zombie {
  return createZombie(
    ZombieType.Shambler,
    x,
    y,
    ZOMBIE_HP.SHAMBLER,
    ZOMBIE_SPEED.SHAMBLER,
    ZOMBIE_DAMAGE.SHAMBLER,
    POINTS.SHAMBLER_KILL,
    false,
  );
}

export function createRunner(x: number, y: number): Zombie {
  return createZombie(
    ZombieType.Runner,
    x,
    y,
    ZOMBIE_HP.RUNNER,
    ZOMBIE_SPEED.RUNNER,
    ZOMBIE_DAMAGE.RUNNER,
    POINTS.RUNNER_KILL,
    false,
  );
}

export function createSpitter(x: number, y: number): Zombie {
  return createZombie(
    ZombieType.Spitter,
    x,
    y,
    ZOMBIE_HP.SPITTER,
    ZOMBIE_SPEED.SPITTER,
    ZOMBIE_DAMAGE.SPITTER,
    POINTS.SPITTER_KILL,
    true,
  );
}
