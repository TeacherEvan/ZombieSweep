import Phaser from "phaser";
import { GAME } from "../config/constants";
import { DayManager } from "../systems/DayManager";
import { GameState } from "../systems/GameState";
import { prefersReducedMotion, pulse } from "../utils/animations";
import { BC, BROADCAST_FONT } from "./broadcast-styles";

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
  private deliveryBar!: Phaser.GameObjects.Graphics;
  private deliveryCountText!: Phaser.GameObjects.Text;

  private paperCount: number;
  private ammoCount: number;
  private lastScore = 0;
  private lastLives = 0;
  private lastPaperCount = 0;
  private lastAmmoCount = 0;
  private lastSubscribers = 0;
  private deliveryCompleted = 0;
  private deliveryTotal = 0;
  private lastDeliveryCompleted = -1;
  private cachedDayString: string;

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    paperCount: number,
    ammoCount: number,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.paperCount = paperCount;
    this.ammoCount = ammoCount;
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
    this.hudBg.fillRect(0, 0, width, 32);
    // Red left accent
    this.hudBg.fillStyle(BC.RED, 0.9);
    this.hudBg.fillRect(0, 0, 3, 32);
    // Bottom edge line
    this.hudBg.lineStyle(1, BC.CHROME_EDGE, 0.4);
    this.hudBg.lineBetween(0, 32, width, 32);

    const labelCfg: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: BROADCAST_FONT,
      fontSize: "10px",
      fontStyle: "600",
      color: BC.TEXT_DIM,
      letterSpacing: 2,
    };
    const valueCfg: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: BROADCAST_FONT,
      fontSize: "14px",
      fontStyle: "700",
      color: BC.TEXT,
    };

    let x = 14;
    const cy = 16;

    // Day — static for the duration of the scene, set once
    this.scene.add
      .text(x, cy - 5, "DAY", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.scene.add
      .text(x, cy + 7, this.cachedDayString, valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += 120;

    // Score
    this.scene.add
      .text(x, cy - 5, "SCORE", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.scoreText = this.scene.add
      .text(x, cy + 7, "", { ...valueCfg, color: BC.css.GOLD })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += 100;

    // Lives — Graphics-drawn circles
    this.scene.add
      .text(x, cy - 5, "LIVES", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.livesX = x;
    this.livesGfx = this.scene.add.graphics();
    this.livesGfx.setScrollFactor(0).setDepth(100);
    this.drawLives();
    x += 60;

    // Papers
    this.scene.add
      .text(x, cy - 5, "PAPERS", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.papersText = this.scene.add
      .text(x, cy + 7, "", valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += 80;

    // Ammo (separate field)
    this.scene.add
      .text(x, cy - 5, "AMMO", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.ammoText = this.scene.add
      .text(x, cy + 7, "", valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += 70;

    // Subscribers
    this.scene.add
      .text(x, cy - 5, "SUBS", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.subscribersText = this.scene.add
      .text(x, cy + 7, "", valueCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += 70;

    // Delivery progress bar (right-aligned area)
    this.scene.add
      .text(x, cy - 5, "ROUTE", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.deliveryBar = this.scene.add.graphics();
    this.deliveryBar.setScrollFactor(0).setDepth(100);
    this.deliveryCountText = this.scene.add
      .text(x + 90, cy + 7, "", {
        ...valueCfg,
        fontSize: "11px",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.drawDeliveryBar(x);

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

  setDeliveryProgress(completed: number, total: number): void {
    this.deliveryCompleted = completed;
    this.deliveryTotal = total;
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
          ease: "Quart.easeOut",
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

    // Delivery progress bar
    if (this.deliveryCompleted !== this.lastDeliveryCompleted) {
      this.drawDeliveryBar(this.deliveryBarX);
      if (
        this.deliveryCompleted > this.lastDeliveryCompleted &&
        this.lastDeliveryCompleted >= 0
      ) {
        pulse(this.scene, this.deliveryBar, 1.1, 120);
      }
      this.lastDeliveryCompleted = this.deliveryCompleted;
    }
  }

  private drawLives(): void {
    this.livesGfx.clear();
    const maxLives = GAME.STARTING_LIVES;
    for (let i = 0; i < maxLives; i++) {
      const active = i < this.gameState.lives;
      this.livesGfx.fillStyle(
        active ? BC.RED : BC.CHROME_EDGE,
        active ? 1 : 0.3,
      );
      this.livesGfx.fillCircle(this.livesX + i * 14, 23, 5);
    }
  }

  private deliveryBarX = 0;

  private drawDeliveryBar(x: number): void {
    this.deliveryBarX = x;
    this.deliveryBar.clear();
    const barW = 80;
    const barH = 8;
    const barY = 20;

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
      this.deliveryCountText.setText(
        `${this.deliveryCompleted}/${this.deliveryTotal}`,
      );
    }
  }
}
