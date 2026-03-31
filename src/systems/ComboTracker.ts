const COMBO_WINDOW_MS = 2000;

export interface ComboResult {
  comboCount: number;
  isCombo: boolean;
}

export class ComboTracker {
  private lastKillTime = 0;
  private comboCount = 0;

  registerKill(timestamp: number): ComboResult {
    if (
      this.lastKillTime > 0 &&
      timestamp - this.lastKillTime <= COMBO_WINDOW_MS
    ) {
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
}
