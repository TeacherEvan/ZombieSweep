import Phaser from "phaser";
import { GAME } from "../config/constants";
import { GameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";

interface DeliveryData {
  house: { isSubscriber: boolean };
  delivered: boolean;
}

export class ScoreSummaryScene extends Phaser.Scene {
  private gameState!: GameState;
  private deliveryData: DeliveryData[] = [];

  constructor() {
    super({ key: "ScoreSummaryScene" });
  }

  init(data: { deliveryData: DeliveryData[] }): void {
    this.deliveryData = data.deliveryData || [];
  }

  create(): void {
    this.gameState = this.registry.get("gameState") as GameState;
    this.cameras.main.setBackgroundColor("#0d0d0d");

    const { width, height } = this.cameras.main;
    const cx = width / 2;

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0x1a1a0a, 0.3);
    bgGlow.fillEllipse(cx, height * 0.4, width * 0.7, height * 0.6);

    // Accent bars
    const borders = this.add.graphics();
    borders.fillStyle(0xddaa22, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    let y = 35;

    // Title
    const title = this.add
      .text(cx, y, `DAY ${this.gameState.day} COMPLETE`, {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "40px",
        color: "#ddaa22",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ffcc44",
          blur: 12,
          fill: true,
        },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: { from: 1.2, to: 1 },
      scaleY: { from: 1.2, to: 1 },
      duration: 500,
      ease: "Back.easeOut",
    });

    y += 60;

    // Divider
    const div = this.add.graphics();
    div.fillStyle(0x333322, 1);
    div.fillRect(cx - 180, y, 360, 1);
    y += 20;

    // Calculate delivery stats
    const subscriberHouses = this.deliveryData.filter(
      (d) => d.house.isSubscriber,
    );
    const successfulDeliveries = subscriberHouses.filter(
      (d) => d.delivered,
    ).length;
    const missedDeliveries = subscriberHouses.filter(
      (d) => !d.delivered,
    ).length;

    // Delivery stat row
    const deliveryRatio =
      subscriberHouses.length > 0
        ? successfulDeliveries / subscriberHouses.length
        : 0;
    const deliveryColor =
      deliveryRatio >= 1
        ? "#22aa44"
        : deliveryRatio >= 0.5
          ? "#ddaa22"
          : "#cc4422";

    this.createStatRow(
      cx,
      y,
      "DELIVERIES",
      `${successfulDeliveries} / ${subscriberHouses.length}`,
      deliveryColor,
    );
    y += 38;

    // Subscription changes
    let subsGained = 0;
    let subsLost = 0;

    for (const d of subscriberHouses) {
      if (!d.delivered) {
        this.gameState.cancelSubscription();
        subsLost++;
      }
    }

    if (missedDeliveries === 0 && subscriberHouses.length > 0) {
      this.gameState.gainSubscriber();
      subsGained++;
    }

    if (subsGained > 0) {
      const gainText = this.add
        .text(
          cx,
          y,
          `+${subsGained} NEW SUBSCRIBER${subsGained > 1 ? "S" : ""}!`,
          {
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: "20px",
            color: "#22aa44",
          },
        )
        .setOrigin(0.5, 0)
        .setAlpha(0);

      this.tweens.add({
        targets: gainText,
        alpha: 1,
        scaleX: { from: 1.5, to: 1 },
        scaleY: { from: 1.5, to: 1 },
        duration: 500,
        delay: 300,
        ease: "Back.easeOut",
      });
      y += 32;
    }

    if (subsLost > 0) {
      this.add
        .text(
          cx,
          y,
          `-${subsLost} subscriber${subsLost > 1 ? "s" : ""} cancelled`,
          {
            fontFamily: "'Courier New', monospace",
            fontSize: "15px",
            color: "#cc4422",
          },
        )
        .setOrigin(0.5, 0);
      y += 28;
    }

    y += 12;
    this.createStatRow(
      cx,
      y,
      "SUBSCRIBERS",
      `${this.gameState.subscribers}`,
      "#aaaaaa",
    );
    y += 36;
    this.createStatRow(cx, y, "SCORE", `${this.gameState.score}`, "#ddaa22");
    y += 36;
    this.createStatRow(
      cx,
      y,
      "LIVES",
      "❤️".repeat(this.gameState.lives),
      "#cc4444",
    );
    y += 42;

    // Perfect day bonus
    if (missedDeliveries === 0 && subscriberHouses.length > 0) {
      const sm = new ScoreManager(this.gameState);
      sm.perfectDayBonus();

      const perfectBg = this.add.graphics();
      perfectBg.fillStyle(0x22aa44, 0.1);
      perfectBg.fillRoundedRect(cx - 160, y - 5, 320, 40, 6);

      const perfectText = this.add
        .text(cx, y + 14, "★ PERFECT DAY BONUS! ★", {
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: "22px",
          color: "#22ee66",
          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: "#22ee66",
            blur: 10,
            fill: true,
          },
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: perfectText,
        alpha: 1,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        duration: 600,
        delay: 600,
        ease: "Back.easeOut",
      });
      y += 48;
    }

    // Navigation prompt
    const isLastDay = this.gameState.day >= GAME.TOTAL_DAYS;
    const isSubsGone = this.gameState.subscribers <= 0;

    const promptText =
      isLastDay || isSubsGone || this.gameState.isGameOver()
        ? "PRESS ENTER FOR FINAL RESULTS"
        : "PRESS ENTER TO START NEXT DAY";

    const prompt = this.add
      .text(cx, height - 40, promptText, {
        fontFamily: "'Courier New', monospace",
        fontSize: "13px",
        color: "#555544",
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: prompt,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    if (isLastDay || isSubsGone || this.gameState.isGameOver()) {
      this.input.keyboard!.once("keydown-ENTER", () => {
        this.scene.start("GameOverScene");
      });
    } else {
      this.gameState.advanceDay();
      this.input.keyboard!.once("keydown-ENTER", () => {
        this.scene.start("GameScene");
      });
    }
  }

  private createStatRow(
    cx: number,
    y: number,
    label: string,
    value: string,
    valueColor: string,
  ): void {
    this.add
      .text(cx - 120, y, label, {
        fontFamily: "'Courier New', monospace",
        fontSize: "13px",
        color: "#666655",
      })
      .setOrigin(0, 0);

    this.add
      .text(cx + 120, y, value, {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "20px",
        color: valueColor,
      })
      .setOrigin(1, 0);
  }
}
