import { DIFFICULTY_MULTIPLIERS, Difficulty } from "../config/difficulty";
import {
  VersusMatchReason,
  VersusMatchResult,
  VersusMatchWinner,
} from "./protocol";

export function scoreRivalKill(
  basePoints: number,
  difficulty: Difficulty,
  options: {
    elite: boolean;
    comboBonus?: number;
  },
): number {
  const scaledBase = Math.round(basePoints * DIFFICULTY_MULTIPLIERS[difficulty] * 1.35);
  const eliteBonus = options.elite ? Math.max(30, Math.round(basePoints * 0.8)) : 0;
  return scaledBase + eliteBonus + (options.comboBonus ?? 0);
}

export function createVersusMatchResult(
  driverScore: number,
  rivalScore: number,
  reason: VersusMatchReason,
): VersusMatchResult {
  let winner: VersusMatchWinner = "draw";
  if (driverScore > rivalScore) {
    winner = "driver";
  } else if (rivalScore > driverScore) {
    winner = "rival";
  }

  return {
    mode: "versus",
    reason,
    winner,
    driverScore,
    rivalScore,
  };
}
