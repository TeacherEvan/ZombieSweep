import {
  POINTS,
  ZOMBIE_DAMAGE,
  ZOMBIE_HP,
  ZOMBIE_SPEED,
} from "../config/constants";
import {
  NPC_WEEK_DAYS,
  NpcDefinition,
  NpcFaction,
  NpcRarity,
  NpcRole,
  NpcState,
  NpcTimeSlice,
  createNpcDefinition,
} from "./Npc";

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

export function toNpcDefinition(zombie: Zombie): NpcDefinition {
  switch (zombie.type) {
    case ZombieType.Shambler:
      return createNpcDefinition({
        id: "infected-shambler",
        name: "Shambler",
        faction: NpcFaction.Infected,
        role: NpcRole.Shambler,
        behavior: {
          defaultState: NpcState.Infected,
          fallbackState: NpcState.Infected,
          preferredStates: [
            NpcState.Infected,
            NpcState.Travel,
            NpcState.Investigate,
          ],
          caution: 0,
          aggression: 1,
          support: 0,
        },
        schedule: {
          days: [...NPC_WEEK_DAYS],
          timeSlice: NpcTimeSlice.Night,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["noise"],
          minThreatLevel: 10,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 6,
          rarity: NpcRarity.Common,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["noise"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Infected,
        },
        textureKey: "zombie-shambler",
      });

    case ZombieType.Runner:
      return createNpcDefinition({
        id: "infected-runner",
        name: "Runner",
        faction: NpcFaction.Infected,
        role: NpcRole.Runner,
        behavior: {
          defaultState: NpcState.Infected,
          fallbackState: NpcState.Infected,
          preferredStates: [
            NpcState.Infected,
            NpcState.Travel,
            NpcState.Investigate,
          ],
          caution: 0,
          aggression: 1,
          support: 0,
        },
        schedule: {
          days: [...NPC_WEEK_DAYS],
          timeSlice: NpcTimeSlice.Night,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["alarm", "panic"],
          minThreatLevel: 20,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 4,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["alarm"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Infected,
        },
        textureKey: "zombie-runner",
      });

    case ZombieType.Spitter:
      return createNpcDefinition({
        id: "infected-spitter",
        name: "Spitter",
        faction: NpcFaction.Infected,
        role: NpcRole.Spitter,
        behavior: {
          defaultState: NpcState.Infected,
          fallbackState: NpcState.Infected,
          preferredStates: [
            NpcState.Infected,
            NpcState.Investigate,
            NpcState.Travel,
          ],
          caution: 0,
          aggression: 1,
          support: 0,
        },
        schedule: {
          days: [...NPC_WEEK_DAYS],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["raid", "alarm"],
          minThreatLevel: 25,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 2,
          rarity: NpcRarity.Rare,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["raid"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Infected,
        },
        textureKey: "zombie-spitter",
      });
  }
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
