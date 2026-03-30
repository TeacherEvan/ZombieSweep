import { GAME } from "../config/constants";
import { Difficulty, DIFFICULTY_MULTIPLIERS } from "../config/difficulty";
import { VehicleType } from "../config/vehicles";

export type GameOverReason = "lives" | "subscriptions" | "completed";

export class GameState {
  day: number;
  lives: number;
  score: number;
  subscribers: number;
  difficulty: Difficulty;
  vehicle: VehicleType;

  constructor() {
    this.day = 1;
    this.lives = GAME.STARTING_LIVES;
    this.score = 0;
    this.subscribers = GAME.STARTING_SUBSCRIBERS;
    this.difficulty = Difficulty.EasyStreet;
    this.vehicle = VehicleType.Bicycle;
  }

  configure(difficulty: Difficulty, vehicle: VehicleType): void {
    this.difficulty = difficulty;
    this.vehicle = vehicle;
  }

  addScore(points: number): void {
    const multiplier = DIFFICULTY_MULTIPLIERS[this.difficulty];
    this.score += points * multiplier;
  }

  addRawScore(points: number): void {
    this.score += points;
  }

  loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
  }

  cancelSubscription(): void {
    this.subscribers = Math.max(0, this.subscribers - 1);
  }

  gainSubscriber(): void {
    this.subscribers = Math.min(GAME.MAX_SUBSCRIBERS, this.subscribers + 1);
  }

  advanceDay(): void {
    this.day += 1;
  }

  isGameOver(): boolean {
    return (
      this.lives === 0 || this.subscribers === 0 || this.day > GAME.TOTAL_DAYS
    );
  }

  getGameOverReason(): GameOverReason | null {
    if (this.lives === 0) return "lives";
    if (this.subscribers === 0) return "subscriptions";
    if (this.day > GAME.TOTAL_DAYS) return "completed";
    return null;
  }

  reset(): void {
    this.day = 1;
    this.lives = GAME.STARTING_LIVES;
    this.score = 0;
    this.subscribers = GAME.STARTING_SUBSCRIBERS;
    this.difficulty = Difficulty.EasyStreet;
    this.vehicle = VehicleType.Bicycle;
  }
}
