import Phaser from "phaser";
import { GAME, POINTS } from "../config/constants";
import { MAPS } from "../maps/MapConfig";
import { DayManager } from "../systems/DayManager";
import { GameState, getOrCreateGameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";
import {
  BC,
  BROADCAST_FONT,
  createAlertBanner,
  createChyron,
  createDataRow,
} from "../ui/broadcast-styles";
import { resolveBroadcastViewportContext } from "../ui/broadcast-viewport";
import { headlinePerfectDay } from "../ui/ticker-bridge";
import { fadeIn, fadeToScene, isTouchPrimary } from "../utils/animations";

interface DeliveryData {
  house: { isSubscriber: boolean };
  delivered: boolean;
}

export class ScoreSummaryScene extends Phaser.Scene {
  private gameState!: GameState;
  private deliveryData: DeliveryData[] = [];
  private transitioning = false;

  constructor() {
    super({ key: "ScoreSummaryScene" });
  }

  init(data: { deliveryData: DeliveryData[] }): void {
    this.deliveryData = data.deliveryData || [];
  }

  create(): void {
    this.gameState = getOrCreateGameState(this.registry);
    this.transitioning = false;
    this.cameras.main.setBackgroundColor(BC.BG);
    fadeIn(this);

    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const viewport = resolveBroadcastViewportContext(
      window.innerWidth,
      window.innerHeight,
      isTouchPrimary(),
    );
    const scale = viewport.uiScale;
    const compact = viewport.isCompact;

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(BC.GOLD_DIM, 0.15);
    bgGlow.fillEllipse(cx, height * 0.4, width * 0.7, height * 0.6);

    // Accent bars (gold for score summary)
    const borders = this.add.graphics();
    borders.fillStyle(BC.GOLD, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    // Route name for subtitle
    const dayManager = new DayManager();
    const mapKey = dayManager.getMapForDay(this.gameState.day);
    const mapName = MAPS[mapKey]?.name ?? "UNKNOWN DISTRICT";

    // Chyron
    const chyron = createChyron(
      this,
      38,
      `DAY ${this.gameState.day} REPORT`,
      `ROUTE STATUS — ${mapName.toUpperCase()}`,
      {
        titleSize: compact ? `${Math.round(20 * scale)}px` : "22px",
        subtitleSize: compact ? `${Math.round(10 * scale)}px` : "11px",
      },
    );
    chyron.setX(-width);
    this.tweens.add({
      targets: chyron,
      x: cx,
      duration: 350,
      ease: "Quart.easeOut",
    });

    let y = compact ? 80 : 88;

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

    const deliveryRatio =
      subscriberHouses.length > 0
        ? successfulDeliveries / subscriberHouses.length
        : 0;
    const deliveryColor =
      deliveryRatio >= 1
        ? BC.css.GREEN
        : deliveryRatio >= 0.5
          ? BC.css.GOLD
          : BC.css.RED;

    // Perfect day banner
    if (missedDeliveries === 0 && subscriberHouses.length > 0) {
      const perfectBanner = createAlertBanner(
        this,
        y,
        "★ PERFECT DELIVERY — ALL SUBSCRIBERS REACHED",
        {
          bgColor: BC.GREEN,
          height: compact ? 28 : 30,
          fontSize: compact ? `${Math.round(12 * scale)}px` : "14px",
        },
      );
      perfectBanner.setAlpha(0);
      this.tweens.add({
        targets: perfectBanner,
        alpha: 1,
        duration: 500,
        delay: 300,
        ease: "Quart.easeOut",
      });
      headlinePerfectDay();
      y += 48;
    }

    // Delivery row
    const delRow = createDataRow(
      this,
      cx,
      y,
      "DELIVERIES",
      `${successfulDeliveries} / ${subscriberHouses.length}`,
      {
        valueColor: deliveryColor,
        width: compact ? 500 : 400,
        labelSize: compact ? `${Math.round(11 * scale)}px` : "12px",
        valueSize: compact ? `${Math.round(18 * scale)}px` : "20px",
      },
    );
    delRow.container.setAlpha(0);
    this.tweens.add({
      targets: delRow.container,
      alpha: 1,
      duration: 350,
      delay: 400,
      ease: "Quart.easeOut",
    });
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
      const gainBanner = createAlertBanner(
        this,
        y,
        `+${subsGained} NEW SUBSCRIBER${subsGained > 1 ? "S" : ""}`,
        {
          bgColor: BC.GREEN,
          height: compact ? 28 : 30,
          fontSize: compact ? `${Math.round(12 * scale)}px` : "14px",
        },
      );
      gainBanner.setAlpha(0);
      this.tweens.add({
        targets: gainBanner,
        alpha: 1,
        scaleX: { from: 0.8, to: 1 },
        scaleY: { from: 0.8, to: 1 },
        duration: 400,
        delay: 500,
        ease: "Quart.easeOut",
      });
      y += 40;
    }

    if (subsLost > 0) {
      const lossBanner = createAlertBanner(
        this,
        y,
        `-${subsLost} SUBSCRIBER${subsLost > 1 ? "S" : ""} CANCELLED`,
        {
          bgColor: BC.RED,
          height: compact ? 28 : 30,
          fontSize: compact ? `${Math.round(12 * scale)}px` : "14px",
        },
      );
      lossBanner.setAlpha(0);
      this.tweens.add({
        targets: lossBanner,
        alpha: 1,
        duration: 400,
        delay: 500,
        ease: "Quart.easeOut",
      });
      y += 40;
    }

    y += 8;

    // Subscriber count
    const subRow = createDataRow(
      this,
      cx,
      y,
      "SUBSCRIBERS",
      `${this.gameState.subscribers}`,
      {
        valueColor: BC.TEXT,
        width: compact ? 500 : 400,
        labelSize: compact ? `${Math.round(11 * scale)}px` : "12px",
        valueSize: compact ? `${Math.round(18 * scale)}px` : "20px",
      },
    );
    subRow.container.setAlpha(0);
    this.tweens.add({
      targets: subRow.container,
      alpha: 1,
      duration: 350,
      delay: 600,
      ease: "Quart.easeOut",
    });
    y += 38;

    // Score
    const scoreRow = createDataRow(
      this,
      cx,
      y,
      "SCORE",
      `${this.gameState.score}`,
      {
        valueColor: BC.css.GOLD,
        width: compact ? 500 : 400,
        labelSize: compact ? `${Math.round(11 * scale)}px` : "12px",
        valueSize: compact ? `${Math.round(18 * scale)}px` : "20px",
      },
    );
    scoreRow.container.setAlpha(0);
    this.tweens.add({
      targets: scoreRow.container,
      alpha: 1,
      duration: 350,
      delay: 700,
      ease: "Quart.easeOut",
    });
    y += 38;

    // Lives
    const livesRow = createDataRow(
      this,
      cx,
      y,
      "LIVES",
      "●".repeat(this.gameState.lives),
      {
        valueColor: BC.css.RED,
        width: compact ? 500 : 400,
        labelSize: compact ? `${Math.round(11 * scale)}px` : "12px",
        valueSize: compact ? `${Math.round(18 * scale)}px` : "20px",
      },
    );
    livesRow.container.setAlpha(0);
    this.tweens.add({
      targets: livesRow.container,
      alpha: 1,
      duration: 350,
      delay: 800,
      ease: "Quart.easeOut",
    });
    y += 42;

    // Perfect day bonus (score logic)
    if (missedDeliveries === 0 && subscriberHouses.length > 0) {
      const sm = new ScoreManager(this.gameState);
      sm.perfectDayBonus();

      const bonusBanner = createAlertBanner(
        this,
        y,
        `PERFECT DAY BONUS: +${POINTS.PERFECT_DAY_BONUS}`,
        {
          bgColor: BC.GOLD,
          height: compact ? 28 : 30,
          fontSize: compact ? `${Math.round(12 * scale)}px` : "14px",
        },
      );
      bonusBanner.setAlpha(0);
      this.tweens.add({
        targets: bonusBanner,
        alpha: 1,
        duration: 400,
        delay: 900,
        ease: "Quart.easeOut",
      });
      y += 40;
    }

    // Navigation prompt
    const isLastDay = this.gameState.day >= GAME.TOTAL_DAYS;
    const isSubsGone = this.gameState.subscribers <= 0;

    const touchMode = isTouchPrimary();
    const promptText =
      isLastDay || isSubsGone || this.gameState.isGameOver()
        ? touchMode
          ? "TAP FOR FINAL RESULTS"
          : "PRESS ENTER FOR FINAL RESULTS"
        : touchMode
          ? "TAP TO CONTINUE COVERAGE"
          : "PRESS ENTER TO CONTINUE COVERAGE";

    const prompt = this.add
      .text(cx, height - 36, promptText, {
        fontFamily: BROADCAST_FONT,
        fontSize: compact ? `${Math.round(11 * scale)}px` : "12px",
        fontStyle: "600",
        color: BC.TEXT_MUTED,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const goToGameOver = isLastDay || isSubsGone || this.gameState.isGameOver();

    if (!goToGameOver) {
      this.gameState.advanceDay();
    }

    const advance = () => {
      if (this.transitioning) return;
      this.transitioning = true;
      if (goToGameOver) {
        fadeToScene(this, "GameOverScene");
      } else {
        fadeToScene(this, "GameScene");
      }
    };

    this.input.keyboard?.once("keydown-ENTER", advance);
    this.input.once("pointerdown", advance);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }
}
