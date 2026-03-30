import Phaser from "phaser";
import { POINTS } from "../config/constants";
import { GameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";

export class GameOverScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: "GameOverScene" });
  }

  create(): void {
    this.gameState = this.registry.get("gameState") as GameState;
    const scoreManager = new ScoreManager(this.gameState);
    this.cameras.main.setBackgroundColor("#0a0a0a");

    const cx = 480;
    let y = 50;

    // Game over reason
    const reason = this.gameState.getGameOverReason();
    const headerText = reason === "completed" ? "WEEK COMPLETE!" : "GAME OVER";
    const headerColor = reason === "completed" ? "#00ff00" : "#ff4444";

    this.add
      .text(cx, y, headerText, {
        fontSize: "40px",
        color: headerColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    y += 55;

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
          fontSize: "18px",
          color: "#ff8888",
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
            fontSize: "18px",
            color: "#88ff88",
          },
        )
        .setOrigin(0.5, 0);
      y += 30;
    }

    y += 10;
    this.add
      .text(cx, y, `Day Reached: ${this.gameState.day}`, {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);
    y += 35;

    this.add
      .text(cx, y, `Subscribers: ${this.gameState.subscribers}`, {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);
    y += 35;

    this.add
      .text(cx, y, `FINAL SCORE`, {
        fontSize: "22px",
        color: "#ffcc00",
      })
      .setOrigin(0.5, 0);
    y += 35;

    this.add
      .text(cx, y, `${this.gameState.score}`, {
        fontSize: "48px",
        color: "#ffcc00",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    y += 70;

    // Play Again button
    const playAgainBtn = this.add
      .text(cx, y, "[ PLAY AGAIN ]", {
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    playAgainBtn.on("pointerover", () => playAgainBtn.setColor("#ffcc00"));
    playAgainBtn.on("pointerout", () => playAgainBtn.setColor("#ffffff"));
    playAgainBtn.on("pointerdown", () => {
      this.gameState.reset();
      this.scene.start("WelcomeScene");
    });
    y += 55;

    // Main Menu button
    const menuBtn = this.add
      .text(cx, y, "[ MAIN MENU ]", {
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    menuBtn.on("pointerover", () => menuBtn.setColor("#ffcc00"));
    menuBtn.on("pointerout", () => menuBtn.setColor("#ffffff"));
    menuBtn.on("pointerdown", () => {
      this.gameState.reset();
      this.scene.start("WelcomeScene");
    });

    // Keyboard shortcuts
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.gameState.reset();
      this.scene.start("WelcomeScene");
    });
  }
}
