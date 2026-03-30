import Phaser from "phaser";
import { DayManager } from "../systems/DayManager";
import { GameState } from "../systems/GameState";
import { pulse } from "../utils/animations";

export class HUD {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private dayManager: DayManager;

  private hudBg!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private papersText!: Phaser.GameObjects.Text;
  private subscribersText!: Phaser.GameObjects.Text;

  private paperCount: number;
  private ammoCount: number;
  private lastScore = 0;
  private lastLives = 0;
  private lastPaperCount = 0;

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    paperCount: number,
    ammoCount: number,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.dayManager = new DayManager();
    this.paperCount = paperCount;
    this.ammoCount = ammoCount;
    this.lastScore = gameState.score;
    this.lastLives = gameState.lives;
    this.lastPaperCount = paperCount;

    this.create();
  }

  private create(): void {
    // Semi-transparent HUD background panel
    this.hudBg = this.scene.add.graphics();
    this.hudBg.setScrollFactor(0).setDepth(99);
    this.hudBg.fillStyle(0x000000, 0.55);
    this.hudBg.fillRoundedRect(6, 6, 200, 108, 4);
    this.hudBg.fillStyle(0xcc1100, 0.8);
    this.hudBg.fillRect(6, 6, 3, 108);

    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "'Courier New', monospace",
      fontSize: "11px",
      color: "#666655",
    };
    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Impact, 'Arial Black', sans-serif",
      fontSize: "15px",
      color: "#ddddcc",
    };

    const x = 16;
    const vx = 100;
    let y = 14;

    // Day label + value
    this.scene.add
      .text(x, y, "DAY", labelStyle)
      .setScrollFactor(0)
      .setDepth(100);
    this.dayText = this.scene.add
      .text(vx, y, "", valueStyle)
      .setScrollFactor(0)
      .setDepth(100);
    y += 20;

    // Score
    this.scene.add
      .text(x, y, "SCORE", labelStyle)
      .setScrollFactor(0)
      .setDepth(100);
    this.scoreText = this.scene.add
      .text(vx, y, "", { ...valueStyle, color: "#ddaa22" })
      .setScrollFactor(0)
      .setDepth(100);
    y += 20;

    // Lives
    this.scene.add
      .text(x, y, "LIVES", labelStyle)
      .setScrollFactor(0)
      .setDepth(100);
    this.livesText = this.scene.add
      .text(vx, y, "", { ...valueStyle, fontSize: "14px" })
      .setScrollFactor(0)
      .setDepth(100);
    y += 20;

    // Papers + Ammo
    this.scene.add
      .text(x, y, "PAPERS", labelStyle)
      .setScrollFactor(0)
      .setDepth(100);
    this.papersText = this.scene.add
      .text(vx, y, "", valueStyle)
      .setScrollFactor(0)
      .setDepth(100);
    y += 20;

    // Subscribers
    this.scene.add
      .text(x, y, "SUBS", labelStyle)
      .setScrollFactor(0)
      .setDepth(100);
    this.subscribersText = this.scene.add
      .text(vx, y, "", valueStyle)
      .setScrollFactor(0)
      .setDepth(100);

    this.update();
  }

  setPaperCount(count: number): void {
    this.paperCount = count;
  }

  setAmmoCount(count: number): void {
    this.ammoCount = count;
  }

  update(): void {
    const dow = this.dayManager.getDayOfWeek(this.gameState.day);
    this.dayText.setText(`${this.gameState.day} — ${dow}`);
    this.scoreText.setText(`${this.gameState.score}`);
    this.livesText.setText("❤️".repeat(this.gameState.lives));
    this.papersText.setText(`${this.paperCount}   Ammo: ${this.ammoCount}`);
    this.subscribersText.setText(`${this.gameState.subscribers}/10`);

    // Score changed — pulse the score text
    if (this.gameState.score !== this.lastScore) {
      pulse(this.scene, this.scoreText, 1.3, 180);
      this.lastScore = this.gameState.score;
    }

    // Life lost — flash lives text red then back
    if (this.gameState.lives < this.lastLives) {
      this.livesText.setColor("#ff2222");
      pulse(this.scene, this.livesText, 1.4, 200);
      this.scene.time.delayedCall(300, () => {
        this.livesText.setColor("#ddddcc");
      });
      this.lastLives = this.gameState.lives;
    }

    // Low paper warning — text turns red and pulses
    if (this.paperCount <= 3 && this.paperCount !== this.lastPaperCount) {
      this.papersText.setColor("#cc2222");
      pulse(this.scene, this.papersText, 1.2, 150);
    } else if (this.paperCount > 3) {
      this.papersText.setColor("#ddddcc");
    }
    this.lastPaperCount = this.paperCount;
  }
}
