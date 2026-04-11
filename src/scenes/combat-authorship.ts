import { Difficulty } from "../config/difficulty";
import { PickupType } from "../entities/Pickup";
import { ZombieType } from "../entities/Zombie";

export type CombatAlertTone = "danger" | "warning" | "success";

export interface EliteProfile {
  label: string;
  tint: number;
  scale: number;
  healthMultiplier: number;
  speedMultiplier: number;
  damageBonus: number;
  pointsMultiplier: number;
  tone: CombatAlertTone;
}

export interface CombatEncounterGroup {
  type: ZombieType;
  count: number;
  eliteCount: number;
  spread: "wide" | "center" | "flank";
}

export interface CombatEncounter {
  id: string;
  label: string;
  alert: string;
  tone: CombatAlertTone;
  groups: CombatEncounterGroup[];
}

export interface CombatPickupContext {
  activePickupCount: number;
  ammo: number;
  baseDropChance: number;
  chanceRoll: number;
  difficulty: Difficulty;
  elite: boolean;
  killCount: number;
  lastDropKillCount: number;
  lives: number;
  papers: number;
  typeRoll: number;
}

const ROUTE_EVENT_THRESHOLDS = [0.25, 0.55, 0.85] as const;

const ELITE_PROFILES: Record<ZombieType, EliteProfile> = {
  [ZombieType.Shambler]: {
    label: "Bull Shambler",
    tint: 0xcc3344,
    scale: 1.22,
    healthMultiplier: 2.2,
    speedMultiplier: 1.06,
    damageBonus: 2,
    pointsMultiplier: 2.5,
    tone: "danger",
  },
  [ZombieType.Runner]: {
    label: "Howler Runner",
    tint: 0xff6b2e,
    scale: 1.1,
    healthMultiplier: 1.5,
    speedMultiplier: 1.25,
    damageBonus: 1,
    pointsMultiplier: 2.2,
    tone: "warning",
  },
  [ZombieType.Spitter]: {
    label: "Blight Spitter",
    tint: 0x67b96e,
    scale: 1.14,
    healthMultiplier: 1.75,
    speedMultiplier: 1.1,
    damageBonus: 2,
    pointsMultiplier: 2.35,
    tone: "warning",
  },
};

export function getRouteEventThreshold(index: number): number | null {
  return ROUTE_EVENT_THRESHOLDS[index] ?? null;
}

export function getEliteProfile(type: ZombieType, day: number): EliteProfile {
  const base = ELITE_PROFILES[type];
  const lateWeekBoost = Math.max(0, day - 4) * 0.05;

  return {
    ...base,
    healthMultiplier: base.healthMultiplier + lateWeekBoost,
    speedMultiplier:
      type === ZombieType.Shambler
        ? base.speedMultiplier + lateWeekBoost * 0.25
        : base.speedMultiplier + lateWeekBoost * 0.4,
  };
}

export function getRouteEncounter(
  encounterIndex: number,
  day: number,
  difficulty: Difficulty,
): CombatEncounter {
  const dayBoost = Math.max(0, day - 2);
  const hardModeBonus = difficulty === Difficulty.HardWay ? 1 : 0;

  switch (encounterIndex) {
    case 0:
      return {
        id: "runner-ambush",
        label: "RUNNER AMBUSH",
        alert: "SIRENS SPIKE. RUNNERS ON THE FLANKS.",
        tone: "warning",
        groups: [
          {
            type: ZombieType.Runner,
            count: 3 + Math.min(2, Math.floor(dayBoost / 2)) + hardModeBonus,
            eliteCount: 1,
            spread: "wide",
          },
        ],
      };
    case 1:
      return {
        id: "spitter-siege",
        label: "SPITTER SIEGE",
        alert: "ACID LINE FORMING. STAY MOBILE.",
        tone: "danger",
        groups: [
          {
            type: ZombieType.Spitter,
            count: 2 + Math.min(1, Math.floor(dayBoost / 3)) + hardModeBonus,
            eliteCount: 1,
            spread: "flank",
          },
          {
            type: ZombieType.Shambler,
            count: 2 + hardModeBonus,
            eliteCount: 0,
            spread: "center",
          },
        ],
      };
    default:
      return {
        id: "grave-wall",
        label: "GRAVE WALL",
        alert: "THE BLOCK IS OVERRUN. HOLD THE LINE.",
        tone: "danger",
        groups: [
          {
            type: ZombieType.Shambler,
            count: 4 + Math.min(2, Math.floor(dayBoost / 2)) + hardModeBonus,
            eliteCount: 1,
            spread: "center",
          },
          {
            type: ZombieType.Runner,
            count: 2 + hardModeBonus,
            eliteCount: day >= 5 ? 1 : 0,
            spread: "wide",
          },
        ],
      };
  }
}

export function getSurgeEncounter(
  day: number,
  difficulty: Difficulty,
  baseCount: number,
  killCount: number,
): CombatEncounter {
  const hardModeBonus = difficulty === Difficulty.HardWay ? 1 : 0;
  const extra = Math.min(2, Math.floor((day - 1) / 3));

  if (killCount % 2 === 0) {
    return {
      id: "howler-surge",
      label: "HOWLER SURGE",
      alert: "FAST CONTACTS BREAKING THROUGH.",
      tone: "warning",
      groups: [
        {
          type: ZombieType.Runner,
          count: Math.max(3, Math.floor(baseCount / 2)) + extra + hardModeBonus,
          eliteCount: 1,
          spread: "wide",
        },
      ],
    };
  }

  return {
    id: "toxic-front",
    label: "TOXIC FRONT",
    alert: "SPITTERS ARE BLANKETING THE STREET.",
    tone: "danger",
    groups: [
      {
        type: ZombieType.Spitter,
        count: 2 + extra + hardModeBonus,
        eliteCount: 1,
        spread: "flank",
      },
      {
        type: ZombieType.Shambler,
        count: Math.max(2, Math.floor(baseCount / 3)),
        eliteCount: 0,
        spread: "center",
      },
    ],
  };
}

export function resolveCombatPickupDrop(
  context: CombatPickupContext,
): PickupType | null {
  const killGap = context.elite
    ? 1
    : context.difficulty === Difficulty.HardWay
      ? 4
      : 3;

  if (
    !context.elite &&
    context.killCount - context.lastDropKillCount < killGap
  ) {
    return null;
  }

  if (context.activePickupCount >= 4) {
    return null;
  }

  const resourcePressure =
    (context.lives <= 1 ? 0.12 : 0) +
    (context.ammo <= 2 ? 0.1 : context.ammo <= 5 ? 0.05 : 0) +
    (context.papers <= 3 ? 0.08 : 0);

  const chance = Math.min(
    0.72,
    context.baseDropChance + resourcePressure + (context.elite ? 0.22 : 0),
  );

  if (context.chanceRoll > chance) {
    return null;
  }

  const healthWeight = context.lives <= 1 ? 0.34 : context.lives === 2 ? 0.18 : 0.06;
  const ammoWeight = context.ammo <= 2 ? 0.45 : context.ammo <= 5 ? 0.32 : 0.2;
  const paperWeight = context.papers <= 3 ? 0.32 : 0.22;
  const totalWeight = healthWeight + ammoWeight + paperWeight;
  const roll = context.typeRoll * totalWeight;

  if (roll <= healthWeight) return PickupType.HealthKit;
  if (roll <= healthWeight + ammoWeight) return PickupType.AmmoCrate;
  return PickupType.NewspaperBundle;
}
