import { CITIZEN_PENALTY, POINTS } from "../config/constants";
import { GameState } from "./GameState";

export class ScoreManager {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  porchDelivery(): void {
    this.gameState.addScore(POINTS.PORCH_DELIVERY);
  }

  mailboxDelivery(): void {
    this.gameState.addScore(POINTS.MAILBOX_DELIVERY);
  }

  shamblerKill(): void {
    this.gameState.addScore(POINTS.SHAMBLER_KILL);
  }

  runnerKill(): void {
    this.gameState.addScore(POINTS.RUNNER_KILL);
  }

  spitterKill(): void {
    this.gameState.addScore(POINTS.SPITTER_KILL);
  }

  comboBonus(points: number): void {
    this.gameState.addRawScore(points);
  }

  windowBreak(): void {
    this.gameState.addScore(POINTS.NONSUB_WINDOW);
  }

  tombstoneKnock(): void {
    this.gameState.addScore(POINTS.NONSUB_TOMBSTONE);
  }

  trainingTarget(): void {
    this.gameState.addScore(POINTS.TRAINING_TARGET);
  }

  trainingRamp(): void {
    this.gameState.addScore(POINTS.TRAINING_RAMP);
  }

  perfectDayBonus(): void {
    this.gameState.addScore(POINTS.PERFECT_DAY_BONUS);
  }

  remainingLifeBonus(livesRemaining: number): void {
    this.gameState.addRawScore(POINTS.REMAINING_LIFE_BONUS * livesRemaining);
  }

  hitFriendlyNeighbor(): void {
    this.applyPenalty(CITIZEN_PENALTY.FRIENDLY_NEIGHBOR);
  }

  hitPanickedRunner(): void {
    this.applyPenalty(CITIZEN_PENALTY.PANICKED_RUNNER);
  }

  hitArmedSurvivalist(): void {
    this.applyPenalty(CITIZEN_PENALTY.ARMED_SURVIVALIST);
  }

  private applyPenalty(penalty: number): void {
    this.gameState.addRawScore(penalty);
    if (this.gameState.score < 0) {
      this.gameState.score = 0;
    }
  }
}
