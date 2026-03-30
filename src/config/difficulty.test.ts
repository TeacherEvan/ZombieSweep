import { describe, expect, it } from "vitest";
import {
  Difficulty,
  DIFFICULTY_MULTIPLIERS,
  DIFFICULTY_OBSTACLE_FREQUENCY,
  DIFFICULTY_ZOMBIE_DENSITY,
} from "./difficulty";

describe("difficulty config", () => {
  it("should have three difficulty levels", () => {
    expect(Object.keys(DIFFICULTY_MULTIPLIERS)).toHaveLength(3);
  });

  it("Easy Street has 1x point multiplier", () => {
    expect(DIFFICULTY_MULTIPLIERS[Difficulty.EasyStreet]).toBe(1);
  });

  it("Middle Road has 2x point multiplier", () => {
    expect(DIFFICULTY_MULTIPLIERS[Difficulty.MiddleRoad]).toBe(2);
  });

  it("Hard Way has 3x point multiplier", () => {
    expect(DIFFICULTY_MULTIPLIERS[Difficulty.HardWay]).toBe(3);
  });

  it("zombie density scales with difficulty", () => {
    expect(DIFFICULTY_ZOMBIE_DENSITY[Difficulty.EasyStreet]).toBeLessThan(
      DIFFICULTY_ZOMBIE_DENSITY[Difficulty.MiddleRoad],
    );
    expect(DIFFICULTY_ZOMBIE_DENSITY[Difficulty.MiddleRoad]).toBeLessThan(
      DIFFICULTY_ZOMBIE_DENSITY[Difficulty.HardWay],
    );
  });

  it("obstacle frequency scales with difficulty", () => {
    expect(DIFFICULTY_OBSTACLE_FREQUENCY[Difficulty.EasyStreet]).toBeLessThan(
      DIFFICULTY_OBSTACLE_FREQUENCY[Difficulty.MiddleRoad],
    );
    expect(DIFFICULTY_OBSTACLE_FREQUENCY[Difficulty.MiddleRoad]).toBeLessThan(
      DIFFICULTY_OBSTACLE_FREQUENCY[Difficulty.HardWay],
    );
  });

  it("Hard Way zombie density is 1.0 (maximum)", () => {
    expect(DIFFICULTY_ZOMBIE_DENSITY[Difficulty.HardWay]).toBe(1.0);
  });

  it("all multipliers are positive integers", () => {
    for (const diff of Object.values(Difficulty)) {
      expect(DIFFICULTY_MULTIPLIERS[diff]).toBeGreaterThan(0);
      expect(Number.isInteger(DIFFICULTY_MULTIPLIERS[diff])).toBe(true);
    }
  });

  it("all density values are between 0 and 1 inclusive", () => {
    for (const diff of Object.values(Difficulty)) {
      expect(DIFFICULTY_ZOMBIE_DENSITY[diff]).toBeGreaterThanOrEqual(0);
      expect(DIFFICULTY_ZOMBIE_DENSITY[diff]).toBeLessThanOrEqual(1);
      expect(DIFFICULTY_OBSTACLE_FREQUENCY[diff]).toBeGreaterThanOrEqual(0);
      expect(DIFFICULTY_OBSTACLE_FREQUENCY[diff]).toBeLessThanOrEqual(1);
    }
  });
});
