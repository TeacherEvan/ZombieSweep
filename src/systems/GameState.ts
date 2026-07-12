import { GAME } from '../config/constants';
import { Difficulty, DIFFICULTY_MULTIPLIERS } from '../config/difficulty';
import { VehicleType } from '../config/vehicles';

export type GameOverReason = 'lives' | 'subscriptions' | 'completed';

/**
 * Safely retrieve GameState from a Phaser registry.
 * Returns existing instance or creates + registers a fresh one
 * so scenes never crash when loaded out of order.
 */
export function getOrCreateGameState(registry: {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}): GameState {
  const existing = registry.get('gameState');
  if (existing instanceof GameState) return existing;
  const fresh = new GameState();
  registry.set('gameState', fresh);
  return fresh;
}

export class GameState {
  day: number;
  lives: number;
  score: number;
  subscribers: number;
  difficulty: Difficulty;
  vehicle: VehicleType;
  accuracyHistory: number[];
  /** Live, per-day performance counters that drive in-run adaptive difficulty. */
  liveThrows: number;
  liveHits: number;
  liveKills: number;
  liveHitsTaken: number;

  constructor() {
    this.day = 1;
    this.lives = GAME.STARTING_LIVES;
    this.score = 0;
    this.subscribers = GAME.STARTING_SUBSCRIBERS;
    this.difficulty = Difficulty.EasyStreet;
    this.vehicle = VehicleType.Bicycle;
    this.accuracyHistory = [];
    this.liveThrows = 0;
    this.liveHits = 0;
    this.liveKills = 0;
    this.liveHitsTaken = 0;
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

  gainLife(): void {
    this.lives = Math.min(GAME.STARTING_LIVES, this.lives + 1);
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
    return this.lives === 0 || this.subscribers === 0 || this.day > GAME.TOTAL_DAYS;
  }

  getGameOverReason(): GameOverReason | null {
    if (this.lives === 0) return 'lives';
    if (this.subscribers === 0) return 'subscriptions';
    if (this.day > GAME.TOTAL_DAYS) return 'completed';
    return null;
  }

  reset(): void {
    this.day = 1;
    this.lives = GAME.STARTING_LIVES;
    this.score = 0;
    this.subscribers = GAME.STARTING_SUBSCRIBERS;
    this.difficulty = Difficulty.EasyStreet;
    this.vehicle = VehicleType.Bicycle;
    this.accuracyHistory = [];
    this.liveThrows = 0;
    this.liveHits = 0;
    this.liveKills = 0;
    this.liveHitsTaken = 0;
  }

  saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    const saveState = {
      day: this.day,
      lives: this.lives,
      score: this.score,
      subscribers: this.subscribers,
      difficulty: this.difficulty,
      vehicle: this.vehicle,
      accuracyHistory: this.accuracyHistory,
      liveThrows: this.liveThrows,
      liveHits: this.liveHits,
      liveKills: this.liveKills,
      liveHitsTaken: this.liveHitsTaken,
    };
    window.localStorage.setItem('zombiesweep_savestate', JSON.stringify(saveState));
  }

  loadFromLocalStorage(): boolean {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem('zombiesweep_savestate');
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      this.day = parsed.day ?? 1;
      this.lives = parsed.lives ?? GAME.STARTING_LIVES;
      this.score = parsed.score ?? 0;
      this.subscribers = parsed.subscribers ?? GAME.STARTING_SUBSCRIBERS;
      this.difficulty = parsed.difficulty ?? this.difficulty;
      this.vehicle = parsed.vehicle ?? this.vehicle;
      this.accuracyHistory = parsed.accuracyHistory ?? [];
      this.liveThrows = parsed.liveThrows ?? 0;
      this.liveHits = parsed.liveHits ?? 0;
      this.liveKills = parsed.liveKills ?? 0;
      this.liveHitsTaken = parsed.liveHitsTaken ?? 0;
      return true;
    } catch {
      return false;
    }
  }

  clearLocalStorage(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('zombiesweep_savestate');
  }

  /**
   * Adaptive difficulty multiplier combining two signals:
   *  1. Historical day-accuracy (accuracyHistory) — coarse, per-day.
   *  2. Live, in-run performance (liveThrows/liveHits/liveKills/liveHitsTaken)
   *     — fine, reacts within a day so a flawless run ramps pressure up and a
   *     struggling one eases off, the way modern arcade roguelites do.
   *
   * When there is no live data yet (start of a day, fresh game) the live term
   * contributes 0, so callers still see exactly the historical multiplier —
   * preserving the documented unit-test contract.
   */
  getAdaptiveMultiplier(): number {
    const historyComponent = this.getHistoryMultiplier();
    const liveComponent = this.getLiveMultiplier();
    // Drop the live term's neutral 1.0 so it only adds/subtracts on top of
    // the historical baseline.
    return clampMultiplier(historyComponent * liveComponent);
  }

  private getHistoryMultiplier(): number {
    if (this.accuracyHistory.length === 0) return 1.0;
    const sum = this.accuracyHistory.reduce((a, b) => a + b, 0);
    const avg = sum / this.accuracyHistory.length;
    if (avg > 0.9) return 1.15; // 15% harder
    if (avg < 0.7) return 0.85; // 15% easier
    return 1.0;
  }

  private getLiveMultiplier(): number {
    if (this.liveThrows < 3) return 1.0; // not enough samples yet -> neutral
    const accuracy = this.liveHits / this.liveThrows;
    const survival = Math.min(1, this.liveKills / Math.max(1, this.liveHitsTaken + 1));
    // Blend kill-efficiency (60%) with survival (40%); scales ±15%.
    const performance = 0.6 * accuracy + 0.4 * survival;
    if (performance > 0.75) return 1.15; // dominating -> ramp up
    if (performance < 0.45) return 0.85; // struggling -> ease off
    return 1.0;
  }
}

/** Keeps the combined adaptive multiplier within sane bounds (±25%). */
function clampMultiplier(value: number): number {
  return Math.max(0.75, Math.min(1.25, value));
}
