import Phaser from "phaser";
import { DayManager } from "../systems/DayManager";
import { GameState } from "../systems/GameState";
import { pulse } from "../utils/animations";
import { BC, BROADCAST_FONT } from "./broadcast-styles";

export class HUD {
  private scene: Phaser.Scene;
  private gameState: GameState;

  private hudBg!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private papersText!: Phaser.GameObjects.Text;
  private subscribersText!: Phaser.GameObjects.Text;

  private paperCount: number;
  private ammoCount: number;
  private lastScore = 0;
  private lastLives = 0;
  private lastPaperCount = 0;
  private lastAmmoCount = 0;
  private lastSubscribers = 0;
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
    x += 120;

    // Lives
    this.scene.add
      .text(x, cy - 5, "LIVES", labelCfg)
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.livesText = this.scene.add
      .text(x, cy + 7, "", { ...valueCfg, color: BC.css.RED, fontSize: "13px" })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    x += 80;

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
    x += 120;

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

    // Set initial values (avoids empty text on first frame)
    this.scoreText.setText(`${this.gameState.score}`);
    this.livesText.setText("●".repeat(this.gameState.lives));
    this.papersText.setText(`${this.paperCount}   Ammo: ${this.ammoCount}`);
    this.subscribersText.setText(`${this.gameState.subscribers}/10`);
  }

  setPaperCount(count: number): void {
    this.paperCount = count;
  }

  setAmmoCount(count: number): void {
    this.ammoCount = count;
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

    // Lives
    if (this.gameState.lives !== this.lastLives) {
      this.livesText.setText("●".repeat(this.gameState.lives));
      if (this.gameState.lives < this.lastLives) {
        this.livesText.setColor(BC.css.RED_GLOW);
        pulse(this.scene, this.livesText, 1.4, 200);
        this.scene.time.delayedCall(300, () => {
          this.livesText.setColor(BC.css.RED);
        });
      }
      this.lastLives = this.gameState.lives;
    }

    // Papers + Ammo (combined text field)
    if (
      this.paperCount !== this.lastPaperCount ||
      this.ammoCount !== this.lastAmmoCount
    ) {
      this.papersText.setText(`${this.paperCount}   Ammo: ${this.ammoCount}`);

      // Low paper warning
      if (this.paperCount <= 3 && this.paperCount !== this.lastPaperCount) {
        this.papersText.setColor(BC.css.RED);
        pulse(this.scene, this.papersText, 1.2, 150);
      } else if (this.paperCount > 3) {
        this.papersText.setColor(BC.TEXT);
      }
      this.lastPaperCount = this.paperCount;
      this.lastAmmoCount = this.ammoCount;
    }

    // Subscribers
    if (this.gameState.subscribers !== this.lastSubscribers) {
      this.subscribersText.setText(`${this.gameState.subscribers}/10`);
      this.lastSubscribers = this.gameState.subscribers;
    }
  }
}
