import type Phaser from 'phaser';
import { GAME } from '../config/constants';
import { DayManager } from '../systems/DayManager';
import type { GameState } from '../systems/GameState';
import type { CombatAlertTone } from '../scenes/combat-authorship';
import { isTouchPrimary, prefersReducedMotion, pulse } from '../utils/animations';
import { BC, BROADCAST_FONT, MONO_FONT, createStationBug } from './broadcast-styles';
import { resolveBroadcastViewportContext } from './broadcast-viewport';

export class HUD {
  private scene: Phaser.Scene;
  private gameState: GameState;

  private hudBg!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private livesGfx!: Phaser.GameObjects.Graphics;
  private livesX = 0;
  private papersText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private subscribersText!: Phaser.GameObjects.Text;
  private intensityText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboBar!: Phaser.GameObjects.Graphics;
  private deliveryBar!: Phaser.GameObjects.Graphics;
  private deliveryCountText!: Phaser.GameObjects.Text;
  private combatAlertBg!: Phaser.GameObjects.Graphics;
  private combatAlertText!: Phaser.GameObjects.Text;

  // Broadcast-overlay layer (live lower-third treatment)
  private scanline!: Phaser.GameObjects.Graphics;
  private stationBug!: {
    container: Phaser.GameObjects.Container;
    recDot: Phaser.GameObjects.Graphics;
    label: Phaser.GameObjects.Text;
    setBreaking: (breaking: boolean) => void;
  };
  private bugBreaking = false;

  private paperCount: number;
  private ammoCount: number;
  private intensity = 1.0;
  private compactLayout = false;
  private viewportScale = 1;
  private spacingScale = 1;
  private hudHeight = 32;
  private labelFontSize = '10px';
  private valueFontSize = '14px';
  private labelSpacing = 2;
  private lifeSpacing = 14;
  private lifeRadius = 5;
  private lifeY = 23;
  private deliveryBarY = 20;
  private deliveryBarWidth = 80;
  private deliveryBarTextOffset = 90;
  private lastScore = 0;
  private lastLives = 0;
  private lastPaperCount = 0;
  private lastAmmoCount = 0;
  private lastSubscribers = 0;
  private lastIntensity = 1.0;
  private comboCount = 0;
  private comboRemainingMs = 0;
  private comboWindowMs = 2000;
  private deliveryCompleted = 0;
  private deliveryTotal = 0;
  private lastDeliveryCompleted = -1;
  private cachedDayString: string;
  private combatAlertExpiresAt = 0;
  private combatAlertTone: CombatAlertTone = 'danger';

  constructor(scene: Phaser.Scene, gameState: GameState, paperCount: number, ammoCount: number) {
    this.scene = scene;
    this.gameState = gameState;
    this.paperCount = paperCount;
    this.ammoCount = ammoCount;
    const viewport = resolveBroadcastViewportContext(
      window.innerWidth,
      window.innerHeight,
      isTouchPrimary()
    );
    this.viewportScale = viewport.uiScale;
    this.compactLayout = viewport.isCompact;
    this.spacingScale = this.compactLayout ? Math.min(this.viewportScale, 1.15) : 1;
    this.hudHeight = Math.round((this.compactLayout ? 38 : 32) * this.viewportScale);
    this.labelFontSize = this.compactLayout ? `${Math.round(9 * this.viewportScale)}px` : '10px';
    this.valueFontSize = this.compactLayout ? `${Math.round(15 * this.viewportScale)}px` : '14px';
    this.labelSpacing = this.compactLayout ? 1.5 : 2;
    this.lifeSpacing = Math.round((this.compactLayout ? 12 : 14) * this.viewportScale);
    this.lifeRadius = Math.round((this.compactLayout ? 4 : 5) * this.viewportScale);
    this.lifeY = Math.round((this.compactLayout ? 24 : 23) * this.viewportScale);
    this.deliveryBarY = Math.round((this.compactLayout ? 21 : 20) * this.viewportScale);
    this.deliveryBarWidth = Math.round((this.compactLayout ? 72 : 80) * this.viewportScale);
    this.deliveryBarTextOffset = Math.round((this.compactLayout ? 82 : 90) * this.viewportScale);
    this.lastScore = gameState.score;
    this.lastLives = gameState.lives;
    this.lastPaperCount = paperCount;
    this.lastAmmoCount = ammoCount;
    this.lastSubscribers = gameState.subscribers;

    // Day doesn't change during a scene — cache the formatted string
    const dayManager = new DayManager();
    const dow = dayManager.getDayOfWeek(gameState.day);
    this.cachedDayString = `${gameState.day} — ${dow}`;

    this.create();
  }

  private create(): void {
    const { width } = this.scene.cameras.main;

    // Semi-transparent broadcast strip background
    this.hudBg = this.scene.add.graphics();
    this.hudBg.setScrollFactor(0).setDepth(99);
    this.hudBg.fillStyle(BC.CHROME, 0.55);
    this.hudBg.fillRect(0, 0, width, this.hudHeight);
    // Red left accent
    this.hudBg.fillStyle(BC.RED, 0.9);
    this.hudBg.fillRect(0, 0, 3, this.hudHeight);
    // Bottom edge line
    this.hudBg.lineStyle(1, BC.CHROME_EDGE, 0.4);
    this.hudBg.lineBetween(0, this.hudHeight, width, this.hudHeight);

    const cy = this.hudHeight / 2;
    const labelCfg: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: BROADCAST_FONT,
      fontSize: this.labelFontSize,
      fontStyle: '600',
      color: BC.TEXT_DIM,
      letterSpacing: this.labelSpacing,
    };
    const valueCfg: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: MONO_FONT,
      fontSize: this.valueFontSize,
      fontStyle: '700',
      color: BC.TEXT,
    };

    let x = this.compactLayout ? Math.round(10 * this.spacingScale) : 14;

    // Day — static for the duration of the scene, set once
    this.scene.add
      .text(x, cy - 5, 'DAY', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.scene.add
      .text(x, cy + 7, this.cachedDayString, { ...valueCfg, fontFamily: BROADCAST_FONT })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += Math.round((this.compactLayout ? 104 : 120) * this.spacingScale);

    // Score
    this.scene.add
      .text(x, cy - 5, 'SCORE', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.scoreText = this.scene.add
      .text(x, cy + 7, '', { ...valueCfg, color: BC.css.GOLD })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += Math.round((this.compactLayout ? 90 : 100) * this.spacingScale);

    // Lives — Graphics-drawn circles
    this.scene.add
      .text(x, cy - 5, 'LIVES', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.livesX = x;
    this.livesGfx = this.scene.add.graphics();
    this.livesGfx.setScrollFactor(0).setDepth(100);
    this.drawLives();
    x += Math.round((this.compactLayout ? 54 : 60) * this.spacingScale);

    // Papers
    this.scene.add
      .text(x, cy - 5, 'PAPERS', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.papersText = this.scene.add
      .text(x, cy + 7, '', valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += Math.round((this.compactLayout ? 72 : 80) * this.spacingScale);

    // Intensity (live adaptive difficulty) — separate field
    this.scene.add
      .text(x, cy - 5, 'INTENSITY', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.intensityText = this.scene.add
      .text(x, cy + 7, 'NORMAL', valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += Math.round((this.compactLayout ? 80 : 88) * this.spacingScale);

    // Combo (kill-chain indicator with a depleting timer bar)
    this.scene.add
      .text(x, cy - 5, 'COMBO', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.comboText = this.scene.add
      .text(x, cy + 7, '—', valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.comboBar = this.scene.add.graphics();
    this.comboBar.setScrollFactor(0).setDepth(100).setVisible(false);
    this.comboBarX = x;
    x += Math.round((this.compactLayout ? 80 : 88) * this.spacingScale);

    // Ammo (separate field)
    this.scene.add
      .text(x, cy - 5, 'AMMO', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.ammoText = this.scene.add
      .text(x, cy + 7, '', valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += Math.round((this.compactLayout ? 66 : 70) * this.spacingScale);

    // Subscribers
    this.scene.add
      .text(x, cy - 5, 'SUBS', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.subscribersText = this.scene.add
      .text(x, cy + 7, '', valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += Math.round((this.compactLayout ? 66 : 70) * this.spacingScale);

    // Delivery progress bar (right-aligned area)
    this.scene.add
      .text(x, cy - 5, 'ROUTE', labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.deliveryBar = this.scene.add.graphics();
    this.deliveryBar.setScrollFactor(0).setDepth(100);
    this.deliveryCountText = this.scene.add
      .text(x + this.deliveryBarTextOffset, cy + 7, '', {
        ...valueCfg,
        fontSize: this.compactLayout ? `${Math.round(12 * this.viewportScale)}px` : '11px',
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.drawDeliveryBar(x);

    this.combatAlertBg = this.scene.add.graphics();
    this.combatAlertBg.setScrollFactor(0).setDepth(101).setVisible(false);
    this.combatAlertText = this.scene.add
      .text(width / 2, this.hudHeight + Math.round(16 * this.viewportScale), '', {
        fontFamily: BROADCAST_FONT,
        fontSize: this.compactLayout ? `${Math.round(12 * this.viewportScale)}px` : '13px',
        fontStyle: '800',
        color: BC.css.RED_GLOW,
        letterSpacing: 1.4,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102)
      .setVisible(false);

    // ── Broadcast overlay: CRT scanlines across the strip ──
    // Faint horizontal lines + a top highlight so the readout reads as live
    // footage rather than a menu. Static (no flicker) to respect reduced-motion.
    this.scanline = this.scene.add.graphics();
    this.scanline.setScrollFactor(0).setDepth(99);
    const scanH = this.hudHeight;
    const scanStep = Math.max(2, Math.round(2 * this.viewportScale));
    this.scanline.fillStyle(BC.SCAN, 0.05);
    for (let sy = 0; sy < scanH; sy += scanStep * 2) {
      this.scanline.fillRect(0, sy, width, scanStep);
    }
    // Subtle top highlight (screen glare)
    this.scanline.fillStyle(BC.SCAN, 0.06);
    this.scanline.fillRect(0, 0, width, Math.max(1, Math.round(this.viewportScale)));

    // ── Station bug (signature "you're on air" mark) ──
    const bugScale = this.compactLayout ? Math.min(this.viewportScale, 1.1) : this.viewportScale;
    const bugPlateW = Math.round(116 * bugScale);
    this.stationBug = createStationBug(
      this.scene,
      width - bugPlateW / 2 - Math.round(8 * this.viewportScale),
      this.hudHeight / 2,
      { scale: bugScale }
    );

    // Set initial values (avoids empty text on first frame)
    this.scoreText.setText(`${this.gameState.score}`);
    this.papersText.setText(`${this.paperCount}`);
    this.ammoText.setText(`${this.ammoCount}`);
    this.subscribersText.setText(`${this.gameState.subscribers}/10`);
  }

  setPaperCount(count: number): void {
    this.paperCount = count;
  }

  setAmmoCount(count: number): void {
    this.ammoCount = count;
  }

  setIntensity(multiplier: number): void {
    this.intensity = multiplier;
  }

  /**
   * Drives the combo indicator. `remainingMs` is the time left in the current
   * combo window; when it hits 0 the indicator hides (chain broken).
   */
  setCombo(count: number, remainingMs: number, windowMs: number): void {
    this.comboCount = count;
    this.comboRemainingMs = remainingMs;
    this.comboWindowMs = windowMs;
  }

  setDeliveryProgress(completed: number, total: number): void {
    this.deliveryCompleted = completed;
    this.deliveryTotal = total;
  }

  setCombatAlert(message: string, tone: CombatAlertTone = 'danger', durationMs = 1800): void {
    this.combatAlertTone = tone;
    this.combatAlertExpiresAt = this.scene.time.now + durationMs;
    this.combatAlertText.setText(message).setVisible(true).setAlpha(1);
    this.combatAlertBg.setVisible(true).setAlpha(1);
    this.redrawCombatAlert();

    if (!prefersReducedMotion()) {
      pulse(this.scene, this.combatAlertText, 1.08, 140);
    }
  }

  update(): void {
    // Only call setText() when values actually change — Phaser recreates
    // the internal canvas texture on every setText(), which is expensive.

    // Score
    if (this.gameState.score !== this.lastScore) {
      this.scoreText.setText(`${this.gameState.score}`);
      pulse(this.scene, this.scoreText, 1.3, 180);
      this.lastScore = this.gameState.score;
    }

    // Lives — redraw circles when lives change
    if (this.gameState.lives !== this.lastLives) {
      this.drawLives();
      if (this.gameState.lives < this.lastLives && !prefersReducedMotion()) {
        // Flash the lives graphic on loss
        this.scene.tweens.add({
          targets: this.livesGfx,
          alpha: 0.3,
          duration: 150,
          yoyo: true,
          ease: 'Quart.easeOut',
          onComplete: () => {
            this.livesGfx.setAlpha(1);
          },
        });
      }
      this.lastLives = this.gameState.lives;
    }

    // Papers
    if (this.paperCount !== this.lastPaperCount) {
      this.papersText.setText(`${this.paperCount}`);
      if (this.paperCount <= 1) {
        this.papersText.setColor(BC.css.RED_GLOW);
        pulse(this.scene, this.papersText, 1.4, 100);
      } else if (this.paperCount <= 3) {
        this.papersText.setColor(BC.css.RED);
        pulse(this.scene, this.papersText, 1.2, 150);
      } else {
        this.papersText.setColor(BC.TEXT);
      }
      this.lastPaperCount = this.paperCount;
    }

    // Ammo
    if (this.ammoCount !== this.lastAmmoCount) {
      this.ammoText.setText(`${this.ammoCount}`);
      if (this.ammoCount <= 1) {
        this.ammoText.setColor(BC.css.RED_GLOW);
        pulse(this.scene, this.ammoText, 1.4, 100);
      } else if (this.ammoCount <= 2) {
        this.ammoText.setColor(BC.css.RED);
        pulse(this.scene, this.ammoText, 1.2, 150);
      } else {
        this.ammoText.setColor(BC.TEXT);
      }
      this.lastAmmoCount = this.ammoCount;
    }

    // Subscribers
    if (this.gameState.subscribers !== this.lastSubscribers) {
      this.subscribersText.setText(`${this.gameState.subscribers}/10`);
      this.lastSubscribers = this.gameState.subscribers;
    }

    // Intensity (live adaptive difficulty)
    if (this.intensity !== this.lastIntensity) {
      const label = this.intensity > 1.05 ? 'RISING' : this.intensity < 0.95 ? 'EASING' : 'NORMAL';
      const color =
        this.intensity > 1.05
          ? BC.css.RED_GLOW
          : this.intensity < 0.95
            ? BC.css.GREEN_BRIGHT
            : BC.TEXT;
      this.intensityText.setText(label).setColor(color);
      this.lastIntensity = this.intensity;
    }

    // Combo indicator (kill chain + depleting timer bar)
    this.updateCombo();

    // Delivery progress bar
    if (this.deliveryCompleted !== this.lastDeliveryCompleted) {
      this.drawDeliveryBar(this.deliveryBarX);
      if (this.deliveryCompleted > this.lastDeliveryCompleted && this.lastDeliveryCompleted >= 0) {
        pulse(this.scene, this.deliveryBar, 1.1, 120);
      }
      this.lastDeliveryCompleted = this.deliveryCompleted;
    }

    if (this.combatAlertExpiresAt > 0 && this.scene.time.now >= this.combatAlertExpiresAt) {
      this.combatAlertExpiresAt = 0;
      this.combatAlertBg.setVisible(false);
      this.combatAlertText.setVisible(false);
    }

    // Broadcast overlay — station bug
    // Distress "BREAKING" when the courier is cornered (out of papers/ammo).
    const distressed = this.paperCount <= 1 || this.ammoCount <= 1;
    if (distressed !== this.bugBreaking) {
      this.bugBreaking = distressed;
      this.stationBug.setBreaking(distressed);
    }
    // REC dot slow pulse (static under reduced-motion)
    if (!prefersReducedMotion()) {
      const t = this.scene.time.now * 0.004;
      const a = 0.55 + Math.sin(t) * 0.45;
      this.stationBug.recDot.setAlpha(a);
    }
  }

  private drawLives(): void {
    this.livesGfx.clear();
    const maxLives = GAME.STARTING_LIVES;
    for (let i = 0; i < maxLives; i++) {
      const active = i < this.gameState.lives;
      this.livesGfx.fillStyle(active ? BC.RED : BC.CHROME_EDGE, active ? 1 : 0.3);
      this.livesGfx.fillCircle(this.livesX + i * this.lifeSpacing, this.lifeY, this.lifeRadius);
    }
  }

  private deliveryBarX = 0;
  private comboBarX = 0;

  private drawDeliveryBar(x: number): void {
    this.deliveryBarX = x;
    this.deliveryBar.clear();
    const barW = this.deliveryBarWidth;
    const barH = 8;
    const barY = this.deliveryBarY;

    // Background track
    this.deliveryBar.fillStyle(BC.CHROME_EDGE, 0.6);
    this.deliveryBar.fillRect(x, barY, barW, barH);

    // Fill proportional to progress
    if (this.deliveryTotal > 0) {
      const fill = (this.deliveryCompleted / this.deliveryTotal) * barW;
      this.deliveryBar.fillStyle(BC.GREEN, 0.9);
      this.deliveryBar.fillRect(x, barY, fill, barH);
    }

    // Border
    this.deliveryBar.lineStyle(1, BC.CHROME_EDGE, 0.8);
    this.deliveryBar.strokeRect(x, barY, barW, barH);

    // Count text
    if (this.deliveryTotal > 0) {
      this.deliveryCountText.setText(`${this.deliveryCompleted}/${this.deliveryTotal}`);
    }
  }

  private updateCombo(): void {
    const active = this.comboCount >= 2 && this.comboRemainingMs > 0;
    if (!active) {
      if (this.comboText.visible) this.comboText.setVisible(false);
      if (this.comboBar.visible) this.comboBar.setVisible(false);
      return;
    }
    this.comboText.setVisible(true).setText(`×${this.comboCount}`);
    this.comboBar.setVisible(true);
    this.drawComboBar();
  }

  private drawComboBar(): void {
    const x = this.comboBarX;
    const y = this.deliveryBarY;
    const w = this.deliveryBarWidth;
    const h = 6;
    const frac = Math.max(0, Math.min(1, this.comboRemainingMs / this.comboWindowMs));
    this.comboBar.clear();
    // Track
    this.comboBar.fillStyle(BC.CHROME_EDGE, 0.6);
    this.comboBar.fillRect(x, y, w, h);
    // Fill — warms from gold to red as it drains
    const color = frac > 0.5 ? BC.GOLD : BC.RED;
    this.comboBar.fillStyle(color, 0.95);
    this.comboBar.fillRect(x, y, w * frac, h);
    this.comboBar.lineStyle(1, BC.CHROME_EDGE, 0.8);
    this.comboBar.strokeRect(x, y, w, h);
  }

  private redrawCombatAlert(): void {
    const color =
      this.combatAlertTone === 'success'
        ? BC.GREEN
        : this.combatAlertTone === 'warning'
          ? BC.GOLD
          : BC.RED;
    const cssColor =
      this.combatAlertTone === 'success'
        ? BC.css.GREEN_BRIGHT
        : this.combatAlertTone === 'warning'
          ? BC.css.GOLD_GLOW
          : BC.css.RED_GLOW;
    const width = Math.max(
      Math.round(180 * this.viewportScale),
      Math.round(this.combatAlertText.width + 28)
    );
    const height = Math.round((this.compactLayout ? 24 : 22) * this.viewportScale);
    const x = this.scene.cameras.main.width / 2 - width / 2;
    const y = this.hudHeight + Math.round(6 * this.viewportScale);

    this.combatAlertBg.clear();
    this.combatAlertBg.fillStyle(color, 0.16);
    this.combatAlertBg.fillRoundedRect(x, y, width, height, 5);
    this.combatAlertBg.lineStyle(1, color, 0.82);
    this.combatAlertBg.strokeRoundedRect(x, y, width, height, 5);
    this.combatAlertText.setColor(cssColor);
    this.combatAlertText.setPosition(this.scene.cameras.main.width / 2, y + height / 2);
  }
}
