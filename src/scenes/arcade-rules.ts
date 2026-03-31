import { GAME } from "../config/constants";
import { Difficulty } from "../config/difficulty";
import { DeliveryDifficulty, House } from "../entities/House";
import { VehicleType, VEHICLE_STATS } from "../config/vehicles";

export type DeliveryResult = "mailbox" | "porch" | "miss";

export interface DeliveryThresholds {
  vertical: number;
  mailbox: number;
  porch: number;
}

export interface VehicleControlProfile {
  inputResponsiveness: number;
  coastResponsiveness: number;
  maxSpeed: number;
}

export interface WaveSettings {
  count: number;
  interval: number;
}

const DELIVERY_THRESHOLDS: Record<DeliveryDifficulty, DeliveryThresholds> = {
  [DeliveryDifficulty.Easy]: {
    vertical: 70,
    mailbox: 12,
    porch: 34,
  },
  [DeliveryDifficulty.Medium]: {
    vertical: 62,
    mailbox: 11,
    porch: 28,
  },
  [DeliveryDifficulty.Hard]: {
    vertical: 56,
    mailbox: 10,
    porch: 22,
  },
};

const DIFFICULTY_SCROLL_MULTIPLIER: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 0.95,
  [Difficulty.MiddleRoad]: 1,
  [Difficulty.HardWay]: 1.08,
};

const DIFFICULTY_WAVE_INTERVAL_BONUS: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 0,
  [Difficulty.MiddleRoad]: 140,
  [Difficulty.HardWay]: 260,
};

export function getHouseTextureKey(house: House): string {
  return `${house.type.toLowerCase()}-${house.isSubscriber ? "sub" : "nonsub"}`;
}

export function getDeliveryThresholds(house: House): DeliveryThresholds {
  return DELIVERY_THRESHOLDS[house.porchDifficulty];
}

export function classifyDelivery(
  house: House,
  xDistance: number,
  yDistance: number,
): DeliveryResult {
  const thresholds = getDeliveryThresholds(house);
  if (yDistance > thresholds.vertical) return "miss";
  if (xDistance <= thresholds.mailbox) return "mailbox";
  if (xDistance <= thresholds.porch) return "porch";
  return "miss";
}

export function getRouteScrollSpeed(
  day: number,
  deliveredCount: number,
  difficulty: Difficulty,
): number {
  const dayFactor = 1 + (day - 1) * 0.08;
  const deliveryFactor = 1 + Math.min(deliveredCount, GAME.TOTAL_HOUSES) * 0.03;
  return 56 * dayFactor * deliveryFactor * DIFFICULTY_SCROLL_MULTIPLIER[difficulty];
}

export function getVehicleControlProfile(
  vehicleType: VehicleType,
): VehicleControlProfile {
  const stats = VEHICLE_STATS[vehicleType];
  return {
    inputResponsiveness: 0.12 + stats.handling * 0.05,
    coastResponsiveness: 0.1 + stats.stability * 0.04,
    maxSpeed: stats.speed * 30,
  };
}

export function getZombieWaveSettings(
  day: number,
  difficulty: Difficulty,
): WaveSettings {
  const dayGrowth = Math.max(0, day - 1);
  const count = Math.min(9, 2 + Math.floor(dayGrowth * 0.9) + (day >= 6 ? 1 : 0));
  const interval = Math.max(
    1500,
    3000 - dayGrowth * 220 - DIFFICULTY_WAVE_INTERVAL_BONUS[difficulty],
  );

  return { count, interval };
}
