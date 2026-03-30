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
    this.cameras.main.setBackgroundColor("#1a1a2e");

    const cx = 480;
    let y = 40;

    this.add
      .text(cx, y, `DAY ${this.gameState.day} COMPLETE`, {
        fontSize: "32px",
        color: "#ffcc00",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    y += 50;

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

    this.add
      .text(
        cx,
        y,
        `Deliveries: ${successfulDeliveries} / ${subscriberHouses.length}`,
        {
          fontSize: "20px",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5, 0);
    y += 35;

    // Subscription changes
    let subsGained = 0;
    let subsLost = 0;

    // Missed subscriber deliveries = cancel
    for (const d of subscriberHouses) {
      if (!d.delivered) {
        this.gameState.cancelSubscription();
        subsLost++;
      }
    }

    // Good delivery streak can gain subscribers
    if (missedDeliveries === 0 && subscriberHouses.length > 0) {
      this.gameState.gainSubscriber();
      subsGained++;
    }

    if (subsGained > 0) {
      this.add
        .text(
          cx,
          y,
          `+${subsGained} new subscriber${subsGained > 1 ? "s" : ""}!`,
          {
            fontSize: "18px",
            color: "#00ff00",
          },
        )
        .setOrigin(0.5, 0);
      y += 30;
    }

    if (subsLost > 0) {
      this.add
        .text(
          cx,
          y,
          `-${subsLost} subscriber${subsLost > 1 ? "s" : ""} cancelled`,
          {
            fontSize: "18px",
            color: "#ff4444",
          },
        )
        .setOrigin(0.5, 0);
      y += 30;
    }

    y += 10;
    this.add
      .text(cx, y, `Subscribers: ${this.gameState.subscribers}`, {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);
    y += 35;

    this.add
      .text(cx, y, `Score: ${this.gameState.score}`, {
        fontSize: "24px",
        color: "#ffcc00",
      })
      .setOrigin(0.5, 0);
    y += 35;

    this.add
      .text(cx, y, `Lives: ${this.gameState.lives}`, {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);
    y += 50;

    // Perfect day bonus
    if (missedDeliveries === 0 && subscriberHouses.length > 0) {
      const sm = new ScoreManager(this.gameState);
      sm.perfectDayBonus();

      this.add
        .text(cx, y, "PERFECT DAY BONUS!", {
          fontSize: "22px",
          color: "#00ff88",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
      y += 40;
    }

    // Check if game over
    const isLastDay = this.gameState.day >= GAME.TOTAL_DAYS;
    const isSubsGone = this.gameState.subscribers <= 0;

    if (isLastDay || isSubsGone || this.gameState.isGameOver()) {
      this.add
        .text(cx, y + 20, "Press ENTER to see final results", {
          fontSize: "18px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5, 0);

      this.input.keyboard!.once("keydown-ENTER", () => {
        this.scene.start("GameOverScene");
      });
    } else {
      // Advance to next day
      this.gameState.advanceDay();

      this.add
        .text(cx, y + 20, "Press ENTER to start next day", {
          fontSize: "18px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5, 0);

      this.input.keyboard!.once("keydown-ENTER", () => {
        this.scene.start("GameScene");
      });
    }
  }
}
