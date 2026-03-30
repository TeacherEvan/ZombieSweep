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
import { Pickup, PickupType, createPickup } from "../entities/Pickup";
import { DensityLevel, MapConfig } from "./MapConfig";

export interface Route {
  houses: House[];
  hazards: Hazard[];
  pickups: Pickup[];
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

export function generateRoute(
  mapConfig: MapConfig,
  difficulty: Difficulty,
  _day: number,
  subscriberCount: number = GAME.STARTING_SUBSCRIBERS,
): Route {
  const houses = generateHouses(subscriberCount);
  const hazards = generateHazards(mapConfig, difficulty);
  const pickups = generatePickups();

  return { houses, hazards, pickups };
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
