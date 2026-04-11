import { describe, expect, it } from "vitest";

import { Difficulty } from "../config/difficulty";
import { PickupType } from "../entities/Pickup";
import { ZombieType } from "../entities/Zombie";
import {
  getEliteProfile,
  getRouteEncounter,
  getRouteEventThreshold,
  getSurgeEncounter,
  resolveCombatPickupDrop,
} from "./combat-authorship";

describe("combat-authorship", () => {
  it("gives elites distinct profiles by zombie type", () => {
    const shambler = getEliteProfile(ZombieType.Shambler, 5);
    const runner = getEliteProfile(ZombieType.Runner, 5);

    expect(shambler.label).not.toBe(runner.label);
    expect(shambler.healthMultiplier).toBeGreaterThan(runner.healthMultiplier);
    expect(runner.speedMultiplier).toBeGreaterThan(shambler.speedMultiplier);
  });

  it("defines stable route event thresholds", () => {
    expect(getRouteEventThreshold(0)).toBe(0.25);
    expect(getRouteEventThreshold(1)).toBe(0.55);
    expect(getRouteEventThreshold(2)).toBe(0.85);
    expect(getRouteEventThreshold(3)).toBeNull();
  });

  it("creates authored route encounters with named groups", () => {
    const encounter = getRouteEncounter(1, 4, Difficulty.HardWay);

    expect(encounter.label).toBe("SPITTER SIEGE");
    expect(encounter.groups.some((group) => group.type === ZombieType.Spitter)).toBe(
      true,
    );
    expect(encounter.groups.some((group) => group.eliteCount > 0)).toBe(true);
  });

  it("alternates surge encounter flavor based on kill momentum", () => {
    const evenSurge = getSurgeEncounter(4, Difficulty.MiddleRoad, 8, 12);
    const oddSurge = getSurgeEncounter(4, Difficulty.MiddleRoad, 8, 13);

    expect(evenSurge.id).toBe("howler-surge");
    expect(oddSurge.id).toBe("toxic-front");
  });

  it("biases drops toward emergency recovery under heavy pressure", () => {
    const drop = resolveCombatPickupDrop({
      activePickupCount: 0,
      ammo: 1,
      baseDropChance: 0.24,
      chanceRoll: 0.02,
      difficulty: Difficulty.HardWay,
      elite: true,
      killCount: 16,
      lastDropKillCount: 8,
      lives: 1,
      papers: 2,
      typeRoll: 0.02,
    });

    expect(drop).toBe(PickupType.HealthKit);
  });

  it("throttles drops when the route is already flooded", () => {
    const drop = resolveCombatPickupDrop({
      activePickupCount: 5,
      ammo: 6,
      baseDropChance: 0.32,
      chanceRoll: 0.01,
      difficulty: Difficulty.MiddleRoad,
      elite: false,
      killCount: 14,
      lastDropKillCount: 6,
      lives: 3,
      papers: 7,
      typeRoll: 0.4,
    });

    expect(drop).toBeNull();
  });
});
