import { describe, expect, it } from "vitest";

import { Difficulty } from "../config/difficulty";
import { createVersusMatchResult, scoreRivalKill } from "./versus-rules";

describe("versus-rules", () => {
  it("gives the rival a tuned kill score with elite bonuses", () => {
    const standard = scoreRivalKill(50, Difficulty.MiddleRoad, {
      elite: false,
    });
    const elite = scoreRivalKill(50, Difficulty.MiddleRoad, {
      elite: true,
    });

    expect(elite).toBeGreaterThan(standard);
  });

  it("includes combo bonuses in rival scoring", () => {
    const withoutCombo = scoreRivalKill(40, Difficulty.EasyStreet, {
      elite: false,
    });
    const withCombo = scoreRivalKill(40, Difficulty.EasyStreet, {
      elite: false,
      comboBonus: 20,
    });

    expect(withCombo - withoutCombo).toBe(20);
  });

  it("creates a driver win result", () => {
    expect(createVersusMatchResult(500, 320, "route-complete").winner).toBe(
      "driver",
    );
  });

  it("creates a rival win result", () => {
    expect(createVersusMatchResult(180, 420, "driver-down").winner).toBe(
      "rival",
    );
  });

  it("supports draws", () => {
    expect(createVersusMatchResult(300, 300, "route-complete").winner).toBe(
      "draw",
    );
  });
});
