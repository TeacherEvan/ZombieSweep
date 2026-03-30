export { MapName } from "../systems/DayManager";

export type DensityLevel = "low" | "medium" | "high";

export interface MapConfig {
  name: string;
  theme: "suburban" | "urban" | "industrial";
  zombieDensity: DensityLevel;
  hazardDensity: DensityLevel;
  streetWidth: number;
  houseSeparation: number;
}

export const MAPS: Record<string, MapConfig> = {
  MapleGrove: {
    name: "Maple Grove",
    theme: "suburban",
    zombieDensity: "low",
    hazardDensity: "low",
    streetWidth: 8,
    houseSeparation: 4,
  },
  DowntownDeadwood: {
    name: "Downtown Deadwood",
    theme: "urban",
    zombieDensity: "medium",
    hazardDensity: "medium",
    streetWidth: 5,
    houseSeparation: 3,
  },
  RustCreek: {
    name: "Rust Creek",
    theme: "industrial",
    zombieDensity: "high",
    hazardDensity: "high",
    streetWidth: 6,
    houseSeparation: 5,
  },
};
