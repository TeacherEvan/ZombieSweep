import Phaser from "phaser";
import { POINTS } from "../config/constants";
import { mergeCoopRuntimeState } from "../network/runtime";
import { VersusMatchResult } from "../network/protocol";
import { GameState, getOrCreateGameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";
import {
  BC,
  BROADCAST_FONT,
  createAlertBanner,
  createBroadcastButton,
  createChyron,
  createDataRow,
} from "../ui/broadcast-styles";
import { headlineGameOver, headlineVictory } from "../ui/ticker-bridge";
import {
  countUp,
  fadeIn,
  fadeToScene,
  newspaperConfetti,
  tvStatic,
} from "../utils/animations";

export class GameOverScene extends Phaser.Scene {
  private gameState!: GameState;
  private selectedIndex = 0;
  private buttons: ReturnType<typeof createBroadcastButton>[] = [];
  private transitioning = false;
  private versusResult: VersusMatchResult | null = null;

  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data: { versusResult?: VersusMatchResult }): void {
    this.versusResult = data.versusResult ?? null;
  }

  create(): void {
    this.gameState = getOrCreateGameState(this.registry);
    const scoreManager = new ScoreManager(this.gameState);
    this.cameras.main.setBackgroundColor(BC.BG);
    fadeIn(this);
    this.transitioning = false;

    const { width, height } = this.cameras.main;
    const cx = width / 2;
    if (this.versusResult) {
      this.createVersusResolution(cx, width, height);
      return;
    }

    const reason = this.gameState.getGameOverReason();
    const isVictory = reason === "completed";

    if (isVictory) {
      headlineVictory();
    } else {
      headlineGameOver();
    }

    this.selectedIndex = 0;
    this.buttons = [];

    // Background glow
    const bgGlow = this.add.graphics();
    const glowColor = isVictory ? BC.GOLD_DIM : BC.RED_DIM;
    bgGlow.fillStyle(glowColor, 0.2);
    bgGlow.fillEllipse(cx, height * 0.3, width * 0.8, height * 0.6);

    // Accent bars
    const accentColor = isVictory ? BC.GOLD : BC.RED;
    const borders = this.add.graphics();
    borders.fillStyle(accentColor, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    let y = 40;

    if (isVictory) {
      // ── Victory path ──
      const chyron = createChyron(
        this,
        y,
        "SPECIAL REPORT",
        "COURIER SURVIVES FULL WEEK — OPERATION COMPLETE",
      );
      chyron.setX(-width);
      this.tweens.add({
        targets: chyron,
        x: cx,
        duration: 400,
        ease: "Quart.easeOut",
      });

      y += 70;

      // Remaining life bonus
      if (this.gameState.lives > 0) {
        scoreManager.remainingLifeBonus(this.gameState.lives);
        const bonusBanner = createAlertBanner(
          this,
          y,
          `LIFE BONUS: +${this.gameState.lives * POINTS.REMAINING_LIFE_BONUS}`,
          { bgColor: BC.GREEN, height: 30 },
        );
        bonusBanner.setAlpha(0);
        this.tweens.add({
          targets: bonusBanner,
          alpha: 1,
          duration: 400,
          delay: 400,
          ease: "Quart.easeOut",
        });
        y += 44;
      }

      // Stats
      const dayRow = createDataRow(
        this,
        cx,
        y,
        "DAY REACHED",
        `${this.gameState.day}`,
      );
      dayRow.container.setAlpha(0);
      this.tweens.add({
        targets: dayRow.container,
        alpha: 1,
        duration: 350,
        delay: 500,
        ease: "Quart.easeOut",
      });
      y += 34;

      const subRow = createDataRow(
        this,
        cx,
        y,
        "SUBSCRIBERS",
        `${this.gameState.subscribers}`,
      );
      subRow.container.setAlpha(0);
      this.tweens.add({
        targets: subRow.container,
        alpha: 1,
        duration: 350,
        delay: 600,
        ease: "Quart.easeOut",
      });
      y += 44;

      // Final score label
      this.add
        .text(cx, y, "FINAL SCORE", {
          fontFamily: BROADCAST_FONT,
          fontSize: "14px",
          fontStyle: "700",
          color: BC.TEXT_DIM,
          letterSpacing: 3,
        })
        .setOrigin(0.5, 0);
      y += 24;

      // Score count-up
      const scoreText = this.add
        .text(cx, y, "0", {
          fontFamily: BROADCAST_FONT,
          fontSize: "52px",
          fontStyle: "800",
          color: BC.css.GOLD,
          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: BC.css.GOLD_GLOW,
            blur: 16,
            fill: true,
          },
        })
        .setOrigin(0.5, 0)
        .setAlpha(0);

      this.tweens.add({
        targets: scoreText,
        alpha: 1,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        duration: 600,
        delay: 700,
        ease: "Back.easeOut",
        onComplete: () => {
          countUp(this, scoreText, this.gameState.score, 1500, 0);
          newspaperConfetti(this, cx, y - 40, 30);
        },
      });

      y += 80;
    } else {
      // ── Defeat path ──

      // TV static burst — signal loss effect
      tvStatic(this, 350);

      // Red alert banner
      const alertBanner = createAlertBanner(
        this,
        y + 10,
        "SIGNAL LOST — COURIER DOWN",
      );
      alertBanner.setAlpha(0);
      this.tweens.add({
        targets: alertBanner,
        alpha: 1,
        duration: 300,
        delay: 250,
        ease: "Quart.easeOut",
      });

      y += 60;

      // Reason
      let reasonText = "";
      switch (reason) {
        case "lives":
          reasonText = "All lives expended";
          break;
        case "subscriptions":
          reasonText = "All subscribers cancelled";
          break;
      }
      if (reasonText) {
        const reasonLabel = this.add
          .text(cx, y, reasonText, {
            fontFamily: BROADCAST_FONT,
            fontSize: "16px",
            fontStyle: "600i",
            color: BC.TEXT_DIM,
          })
          .setOrigin(0.5, 0)
          .setAlpha(0);
        this.tweens.add({
          targets: reasonLabel,
          alpha: 1,
          duration: 400,
          delay: 500,
          ease: "Quart.easeOut",
        });
        y += 40;
      }

      // Remaining life bonus (if any lives remain — edge case for subscriber loss)
      if (this.gameState.lives > 0) {
        scoreManager.remainingLifeBonus(this.gameState.lives);
      }

      // Stats (subdued)
      const dayRow = createDataRow(
        this,
        cx,
        y,
        "DAY REACHED",
        `${this.gameState.day}`,
        { valueColor: BC.TEXT_DIM },
      );
      dayRow.container.setAlpha(0);
      this.tweens.add({
        targets: dayRow.container,
        alpha: 1,
        duration: 350,
        delay: 600,
        ease: "Quart.easeOut",
      });
      y += 34;

      const subRow = createDataRow(
        this,
        cx,
        y,
        "SUBSCRIBERS",
        `${this.gameState.subscribers}`,
        { valueColor: BC.TEXT_DIM },
      );
      subRow.container.setAlpha(0);
      this.tweens.add({
        targets: subRow.container,
        alpha: 1,
        duration: 350,
        delay: 700,
        ease: "Quart.easeOut",
      });
      y += 44;

      // Final score
      this.add
        .text(cx, y, "FINAL SCORE", {
          fontFamily: BROADCAST_FONT,
          fontSize: "14px",
          fontStyle: "700",
          color: BC.TEXT_DIM,
          letterSpacing: 3,
        })
        .setOrigin(0.5, 0);
      y += 24;

      const scoreText = this.add
        .text(cx, y, "0", {
          fontFamily: BROADCAST_FONT,
          fontSize: "48px",
          fontStyle: "800",
          color: BC.TEXT,
        })
        .setOrigin(0.5, 0)
        .setAlpha(0);

      this.tweens.add({
        targets: scoreText,
        alpha: 1,
        duration: 500,
        delay: 800,
        ease: "Quart.easeOut",
        onComplete: () => {
          countUp(this, scoreText, this.gameState.score, 1200, 0);
        },
      });

      y += 72;
    }

    // ── Buttons ──
    const buttonDefs = isVictory
      ? [
          { text: "PLAY AGAIN", action: "restart" },
          { text: "MAIN MENU", action: "menu" },
        ]
      : [
          { text: "RE-ESTABLISH CONTACT", action: "restart" },
          { text: "MAIN MENU", action: "menu" },
        ];

    buttonDefs.forEach((def, i) => {
      const by = y + i * 52;
      const btn = createBroadcastButton(this, cx, by, def.text, {
        width: 300,
        height: 44,
      });
      this.buttons.push(btn);

      btn.container.setAlpha(0);
      this.tweens.add({
        targets: btn.container,
        alpha: 1,
        duration: 350,
        delay: 900 + i * 100,
        ease: "Quart.easeOut",
      });

      btn.hitArea.on("pointerover", () => {
        this.selectedIndex = i;
        this.updateButtonSelection();
      });
      btn.hitArea.on("pointerdown", () => {
        if (this.transitioning) return;
        this.transitioning = true;
        this.gameState.reset();
        if (def.action === "restart") {
          fadeToScene(this, "WelcomeScene");
        } else {
          fadeToScene(this, "WelcomeScene");
        }
      });
    });

    this.time.delayedCall(950, () => this.updateButtonSelection());

    // Keyboard
    this.input.keyboard?.on("keydown-UP", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      this.selectedIndex = Math.min(
        buttonDefs.length - 1,
        this.selectedIndex + 1,
      );
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-W", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-S", () => {
      this.selectedIndex = Math.min(
        buttonDefs.length - 1,
        this.selectedIndex + 1,
      );
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.buttons[this.selectedIndex]?.hitArea.emit("pointerdown");
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.buttons[this.selectedIndex]?.hitArea.emit("pointerdown");
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  private updateButtonSelection(): void {
    this.buttons.forEach((btn, i) => {
      btn.setSelected(i === this.selectedIndex);
    });
  }

  private createVersusResolution(cx: number, width: number, height: number): void {
    const result = this.versusResult;
    if (!result) return;

    const playerWon = result.winner === "driver";
    const draw = result.winner === "draw";
    const accentColor = draw ? BC.GOLD : playerWon ? BC.GREEN : BC.RED;
    const accentCss = draw ? BC.css.GOLD_GLOW : playerWon ? BC.css.GREEN_BRIGHT : BC.css.RED_GLOW;

    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(draw ? BC.GOLD_DIM : playerWon ? BC.GREEN : BC.RED_DIM, 0.2);
    bgGlow.fillEllipse(cx, height * 0.3, width * 0.82, height * 0.6);

    const borders = this.add.graphics();
    borders.fillStyle(accentColor, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    const chyron = createChyron(
      this,
      38,
      "VERSUS FINAL",
      result.reason === "driver-down"
        ? "MATCH ENDED — DRIVER DOWN"
        : "MATCH ENDED — ROUTE COMPLETE",
    );
    chyron.setX(-width);
    this.tweens.add({
      targets: chyron,
      x: cx,
      duration: 350,
      ease: "Quart.easeOut",
    });

    const verdict = draw ? "DRAW" : playerWon ? "DRIVER VICTORY" : "RIVAL VICTORY";
    this.add
      .text(cx, 118, verdict, {
        fontFamily: BROADCAST_FONT,
        fontSize: "34px",
        fontStyle: "800",
        color: accentCss,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const driverRow = createDataRow(this, cx, 182, "DRIVER SCORE", `${result.driverScore}`, {
      valueColor: BC.css.GOLD,
      width: 420,
    });
    const rivalRow = createDataRow(this, cx, 222, "RIVAL SCORE", `${result.rivalScore}`, {
      valueColor: accentCss,
      width: 420,
    });
    driverRow.container.setAlpha(0);
    rivalRow.container.setAlpha(0);
    this.tweens.add({
      targets: [driverRow.container, rivalRow.container],
      alpha: 1,
      duration: 350,
      delay: 260,
      ease: "Quart.easeOut",
    });

    const banner = createAlertBanner(
      this,
      284,
      draw
        ? "BOTH SIDES DEADLOCKED THE DISTRICT"
        : playerWon
          ? "THE DRIVER OWNS THE ROUTE"
          : "THE RIVAL TOOK THE BOARD",
      {
        bgColor: accentColor,
      },
    );
    banner.setAlpha(0);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 300,
      delay: 420,
      ease: "Quart.easeOut",
    });

    const buttonDefs = [
      { text: "RETURN TO RELAY", action: "relay" },
      { text: "MAIN MENU", action: "menu" },
    ];

    buttonDefs.forEach((def, i) => {
      const by = 360 + i * 52;
      const btn = createBroadcastButton(this, cx, by, def.text, {
        width: 300,
        height: 44,
      });
      this.buttons.push(btn);
      btn.container.setAlpha(0);
      this.tweens.add({
        targets: btn.container,
        alpha: 1,
        duration: 320,
        delay: 520 + i * 90,
        ease: "Quart.easeOut",
      });
      btn.hitArea.on("pointerover", () => {
        this.selectedIndex = i;
        this.updateButtonSelection();
      });
      btn.hitArea.on("pointerdown", () => {
        if (this.transitioning) return;
        this.transitioning = true;
        if (def.action === "relay") {
          mergeCoopRuntimeState(this.registry, {
            phase: "linked",
            statusMessage: "Versus round complete. Ready for another relay launch.",
          });
          fadeToScene(this, "OnlineCoopScene");
          return;
        }
        this.gameState.reset();
        fadeToScene(this, "WelcomeScene");
      });
    });

    this.time.delayedCall(650, () => this.updateButtonSelection());
    this.input.keyboard?.on("keydown-UP", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      this.selectedIndex = Math.min(buttonDefs.length - 1, this.selectedIndex + 1);
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-W", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-S", () => {
      this.selectedIndex = Math.min(buttonDefs.length - 1, this.selectedIndex + 1);
      this.updateButtonSelection();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.buttons[this.selectedIndex]?.hitArea.emit("pointerdown");
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.buttons[this.selectedIndex]?.hitArea.emit("pointerdown");
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }
}
