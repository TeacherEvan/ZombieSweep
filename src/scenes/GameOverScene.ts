import Phaser from "phaser";
import { POINTS } from "../config/constants";
import { GameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";
import { countUp, fadeIn, fadeToScene } from "../utils/animations";

export class GameOverScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: "GameOverScene" });
  }

  create(): void {
    this.gameState = this.registry.get("gameState") as GameState;
    const scoreManager = new ScoreManager(this.gameState);
    this.cameras.main.setBackgroundColor("#0a0a0a");
    fadeIn(this);

    const { width, height } = this.cameras.main;
    const cx = width / 2;

    // Atmospheric background
    const bgGlow = this.add.graphics();
    const reason = this.gameState.getGameOverReason();
    const isVictory = reason === "completed";
    const glowColor = isVictory ? 0x003311 : 0x330000;
    bgGlow.fillStyle(glowColor, 0.3);
    bgGlow.fillEllipse(cx, height * 0.3, width * 0.8, height * 0.6);

    // Accent bars
    const accentColor = isVictory ? 0x22aa44 : 0xcc1100;
    const borders = this.add.graphics();
    borders.fillStyle(accentColor, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    let y = 50;

    // Header
    const headerText = isVictory ? "WEEK COMPLETE!" : "GAME OVER";
    const headerColor = isVictory ? "#22aa44" : "#cc1100";

    const headerShadow = this.add
      .text(cx + 3, y + 3, headerText, {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "56px",
        color: "#000000",
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.5);

    const header = this.add
      .text(cx, y, headerText, {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "56px",
        color: headerColor,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: headerColor,
          blur: 16,
          fill: true,
        },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    // Header entrance animation
    this.tweens.add({
      targets: [header, headerShadow],
      alpha: {
        from: 0,
        to: (target: Phaser.GameObjects.Text) => (target === header ? 1 : 0.5),
      },
      scaleX: { from: 1.3, to: 1 },
      scaleY: { from: 1.3, to: 1 },
      duration: 600,
      ease: "Back.easeOut",
    });

    // Pulse header if game over
    if (!isVictory) {
      this.tweens.add({
        targets: header,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    y += 70;

    if (reason && reason !== "completed") {
      let reasonText = "";
      switch (reason) {
        case "lives":
          reasonText = "You ran out of lives!";
          break;
        case "subscriptions":
          reasonText = "All subscribers cancelled!";
          break;
      }
      this.add
        .text(cx, y, reasonText, {
          fontFamily: "'Courier New', monospace",
          fontSize: "16px",
          color: "#cc6655",
        })
        .setOrigin(0.5, 0);
      y += 35;
    }

    // Remaining life bonus
    if (this.gameState.lives > 0) {
      scoreManager.remainingLifeBonus(this.gameState.lives);
      this.add
        .text(
          cx,
          y,
          `Remaining Life Bonus: +${this.gameState.lives * POINTS.REMAINING_LIFE_BONUS}`,
          {
            fontFamily: "'Courier New', monospace",
            fontSize: "16px",
            color: "#44cc66",
          },
        )
        .setOrigin(0.5, 0);
      y += 30;
    }

    y += 15;

    // Stats section with divider
    const divider = this.add.graphics();
    divider.fillStyle(0x333333, 1);
    divider.fillRect(cx - 160, y, 320, 1);
    y += 20;

    this.add
      .text(cx, y, `Day Reached: ${this.gameState.day}`, {
        fontFamily: "'Courier New', monospace",
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5, 0);
    y += 30;

    this.add
      .text(cx, y, `Subscribers: ${this.gameState.subscribers}`, {
        fontFamily: "'Courier New', monospace",
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5, 0);
    y += 40;

    // Final score — the HERO moment
    this.add
      .text(cx, y, "FINAL SCORE", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "18px",
        color: "#777755",
      })
      .setOrigin(0.5, 0);
    y += 28;

    const scoreText = this.add
      .text(cx, y, "0", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "64px",
        color: "#ddaa22",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ffcc44",
          blur: 20,
          fill: true,
        },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    // Score entrance + count-up animation
    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 800,
      delay: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        countUp(this, scoreText, this.gameState.score, 1500, 0);
      },
    });

    y += 90;

    // Buttons
    const buttons = [
      {
        text: "PLAY AGAIN",
        callback: () => {
          this.gameState.reset();
          fadeToScene(this, "WelcomeScene");
        },
      },
      {
        text: "MAIN MENU",
        callback: () => {
          this.gameState.reset();
          fadeToScene(this, "WelcomeScene");
        },
      },
    ];

    buttons.forEach((btn, i) => {
      const by = y + i * 52;
      const bg = this.add
        .rectangle(cx, by, 260, 44, 0x1a1a1a)
        .setStrokeStyle(2, 0x3d0000)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(cx, by, btn.text, {
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: "20px",
          color: "#aa8877",
        })
        .setOrigin(0.5);

      bg.on("pointerover", () => {
        bg.setFillStyle(0x2a0a08);
        bg.setStrokeStyle(2, 0xcc1100);
        txt.setColor("#ffffff");
      });
      bg.on("pointerout", () => {
        bg.setFillStyle(0x1a1a1a);
        bg.setStrokeStyle(2, 0x3d0000);
        txt.setColor("#aa8877");
      });
      bg.on("pointerdown", () => btn.callback());

      // Staggered entrance
      bg.setAlpha(0);
      txt.setAlpha(0);
      this.tweens.add({
        targets: [bg, txt],
        alpha: 1,
        duration: 400,
        delay: 800 + i * 100,
        ease: "Power2",
      });
    });

    // Keyboard shortcut
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.gameState.reset();
      fadeToScene(this, "WelcomeScene");
    });
  }
}
