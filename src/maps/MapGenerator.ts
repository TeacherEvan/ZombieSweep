import { GAME } from "../config/constants";
import { Difficulty } from "../config/difficulty";
import {
  Hazard,
  createHole,
  createIcePatch,
  createLog,
} from "../entities/Hazard";
import {
  House,
  createColonialHouse,
  createRanchHouse,
  createVictorianHouse,
} from "../entities/House";
import { NpcTimeSlice } from "../entities/Npc";
import { Pickup, PickupType, createPickup } from "../entities/Pickup";
import {
  NpcScheduleContext,
  NpcSpawnPlan,
  buildNpcSpawnPlan,
} from "../systems/NpcScheduler";
import { createTownReputation } from "../systems/TownReputation";
import { DensityLevel, MapConfig } from "./MapConfig";

export interface Route {
  houses: House[];
  hazards: Hazard[];
  pickups: Pickup[];
  npcSpawns: NpcSpawnPlan[];
}

const DENSITY_TO_COUNT: Record<DensityLevel, number> = {
  low: 3,
  medium: 6,
  high: 10,
};

const DIFFICULTY_HAZARD_BONUS: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 0,
  [Difficulty.MiddleRoad]: 2,
  [Difficulty.HardWay]: 5,
};

const HOUSE_CREATORS = [
  createRanchHouse,
  createColonialHouse,
  createVictorianHouse,
];

const ROUTE_TRIGGERS_BY_THEME: Record<MapConfig["theme"], string[]> = {
  suburban: ["porch", "subscriber"],
  urban: ["market", "supply"],
  industrial: ["alarm", "raid"],
};

const SPAWN_ZONES_BY_THEME: Record<MapConfig["theme"], string[]> = {
  suburban: ["FrontPorch", "Yard", "LeftSidewalk", "SidewalkRight"],
  urban: ["FrontPorch", "CenterStreet", "SidewalkRight"],
  industrial: ["CenterStreet", "LeftSidewalk", "SidewalkRight"],
};

const THREAT_BASE_BY_DIFFICULTY: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 20,
  [Difficulty.MiddleRoad]: 42,
  [Difficulty.HardWay]: 65,
};

export function generateRoute(
  mapConfig: MapConfig,
  difficulty: Difficulty,
  day: number,
  subscriberCount: number = GAME.STARTING_SUBSCRIBERS,
): Route {
  const houses = generateHouses(subscriberCount);
  const hazards = generateHazards(mapConfig, difficulty);
  const pickups = generatePickups();
  const npcSpawns = generateNpcSpawns(
    mapConfig,
    difficulty,
    day,
    subscriberCount,
    hazards.length,
  );

  return { houses, hazards, pickups, npcSpawns };
}

function generateHouses(subscriberCount: number): House[] {
  const houses: House[] = [];

  for (let i = 0; i < GAME.TOTAL_HOUSES; i++) {
    const isSubscriber = i < subscriberCount;
    const creatorIndex = i % HOUSE_CREATORS.length;
    const house = HOUSE_CREATORS[creatorIndex](isSubscriber);
    houses.push(house);
  }

  // Shuffle to mix subscriber/non-subscriber positions
  // Using Fisher-Yates with a seeded approach for consistency
  for (let i = houses.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1); // deterministic shuffle
    [houses[i], houses[j]] = [houses[j], houses[i]];
  }

  return houses;
}

function generateHazards(
  mapConfig: MapConfig,
  difficulty: Difficulty,
): Hazard[] {
  const baseCount = DENSITY_TO_COUNT[mapConfig.hazardDensity];
  const totalHazards = baseCount + DIFFICULTY_HAZARD_BONUS[difficulty];
  const hazards: Hazard[] = [];

  const hazardCreators = [createHole, createLog, createIcePatch];

  for (let i = 0; i < totalHazards; i++) {
    const creatorIndex = i % hazardCreators.length;
    const x = (i + 1) * 100;
    const y = (i % 3) * 50;
    hazards.push(hazardCreators[creatorIndex](x, y));
  }

  return hazards;
}

function generatePickups(): Pickup[] {
  const pickups: Pickup[] = [];
  const types = [
    PickupType.NewspaperBundle,
    PickupType.AmmoCrate,
    PickupType.HealthKit,
  ];

  for (let i = 0; i < 5; i++) {
    const type = types[i % types.length];
    pickups.push(createPickup(i * 200, 0, type));
  }

  return pickups;
}

function generateNpcSpawns(
  mapConfig: MapConfig,
  difficulty: Difficulty,
  day: number,
  subscriberCount: number,
  hazardCount: number,
): NpcSpawnPlan[] {
  const timeSlice = getRouteTimeSlice(day);
  const reputation = createTownReputation({
    trust: 50 + subscriberCount * 3 - hazardCount * 2,
    collateral: GAME.TOTAL_HOUSES - subscriberCount,
    alertness:
      THREAT_BASE_BY_DIFFICULTY[difficulty] +
      hazardCount * 2 +
      Math.max(0, day - 1) * 2,
  });

  const context: NpcScheduleContext = {
    day,
    timeSlice,
    mapTags: [mapConfig.theme, mapConfig.name.toLowerCase()],
    routeTriggers: buildRouteTriggers(
      mapConfig,
      difficulty,
      subscriberCount,
      hazardCount,
    ),
    threatLevel: buildThreatLevel(
      difficulty,
      day,
      subscriberCount,
      hazardCount,
    ),
    reputation,
    isSafeZone: mapConfig.theme === "suburban",
    spawnZones: SPAWN_ZONES_BY_THEME[mapConfig.theme],
    limit: buildNpcLimit(difficulty, subscriberCount),
  };

  return buildNpcSpawnPlan(context);
}

function buildRouteTriggers(
  mapConfig: MapConfig,
  difficulty: Difficulty,
  subscriberCount: number,
  hazardCount: number,
): string[] {
  const triggers = [...ROUTE_TRIGGERS_BY_THEME[mapConfig.theme]];

  if (difficulty === Difficulty.HardWay) {
    triggers.push("blockade", "alarm");
  } else if (difficulty === Difficulty.MiddleRoad) {
    triggers.push("alarm");
  }

  if (subscriberCount < GAME.STARTING_SUBSCRIBERS) {
    triggers.push("panic");
  }

  if (hazardCount >= 8) {
    triggers.push("raid");
  }

  return Array.from(new Set(triggers));
}

function buildThreatLevel(
  difficulty: Difficulty,
  day: number,
  subscriberCount: number,
  hazardCount: number,
): number {
  const base = THREAT_BASE_BY_DIFFICULTY[difficulty];
  const dayPressure = Math.max(0, day - 1) * 2;
  const subscriberPressure =
    Math.max(0, GAME.STARTING_SUBSCRIBERS - subscriberCount) * 4;
  const hazardPressure = hazardCount * 2;

  return Math.min(
    100,
    base + dayPressure + subscriberPressure + hazardPressure,
  );
}

function getRouteTimeSlice(day: number): NpcTimeSlice {
  if (day <= 2) return NpcTimeSlice.Daytime;
  if (day <= 5) return NpcTimeSlice.Evening;
  return NpcTimeSlice.Night;
}

function buildNpcLimit(
  difficulty: Difficulty,
  subscriberCount: number,
): number {
  const base = Math.ceil(subscriberCount / 4);
  const difficultyBonus = difficulty === Difficulty.HardWay ? 1 : 0;
  return Math.max(1, Math.min(4, base + difficultyBonus));
}
