const COMBO_WINDOW_MS = 2000;

export interface ComboResult {
  comboCount: number;
  isCombo: boolean;
}

export class ComboTracker {
  private lastKillTime = 0;
  private comboCount = 0;

  registerKill(timestamp: number): ComboResult {
    if (this.lastKillTime > 0 && timestamp - this.lastKillTime <= COMBO_WINDOW_MS) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastKillTime = timestamp;
    return {
      comboCount: this.comboCount,
      isCombo: this.comboCount >= 2,
    };
  }

  resetCombo(): void {
    this.lastKillTime = 0;
    this.comboCount = 0;
  }

  /** The size of the combo window in milliseconds. */
  get windowMs(): number {
    return COMBO_WINDOW_MS;
  }

  /** Current combo count (1 = most recent kill started a fresh chain). */
  get count(): number {
    return this.comboCount;
  }

  /** Milliseconds left in the current combo window (0 if no active combo). */
  remainingMs(now: number): number {
    if (this.comboCount === 0 || this.lastKillTime === 0) return 0;
    return Math.max(0, COMBO_WINDOW_MS - (now - this.lastKillTime));
  }

  /** Whether a combo chain is currently alive (window hasn't elapsed). */
  isActive(now: number): boolean {
    return this.comboCount >= 1 && this.remainingMs(now) > 0;
  }
}
