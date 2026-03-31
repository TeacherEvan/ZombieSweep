import Phaser from "phaser";
import { Difficulty } from "../config/difficulty";
import { VehicleType } from "../config/vehicles";
import { getOrCreateGameState } from "../systems/GameState";
import { BC, BROADCAST_FONT, createChyron } from "../ui/broadcast-styles";
import { resolveBroadcastViewportContext } from "../ui/broadcast-viewport";
import { fadeIn, fadeToScene, isTouchPrimary } from "../utils/animations";

const THREAT_LEVELS: Record<
  string,
  {
    threat: string;
    label: string;
    desc: string;
    color: number;
    cssColor: string;
  }
> = {
  [Difficulty.EasyStreet]: {
    threat: "LOW",
    label: "EASY STREET",
    desc: "1× Points · Low density",
    color: 0x22aa44,
    cssColor: "#22aa44",
  },
  [Difficulty.MiddleRoad]: {
    threat: "ELEVATED",
    label: "MIDDLE ROAD",
    desc: "2× Points · Medium density",
    color: 0xcc8822,
    cssColor: "#cc8822",
  },
  [Difficulty.HardWay]: {
    threat: "SEVERE",
    label: "THE HARD WAY",
    desc: "3× Points · High density",
    color: 0xcc1100,
    cssColor: "#cc1100",
  },
};

export class DifficultySelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private difficulties = Object.values(Difficulty);
  private rows: {
    bg: Phaser.GameObjects.Graphics;
    label: Phaser.GameObjects.Text;
    threat: Phaser.GameObjects.Text;
    desc: Phaser.GameObjects.Text;
    hitArea: Phaser.GameObjects.Rectangle;
    info: (typeof THREAT_LEVELS)[string];
  }[] = [];
  private vehicle!: VehicleType;
  private transitioning = false;
  private compactLayout = false;
  private rowWidth = 520;
  private rowHeight = 76;
  private rowStep = 100;
  private rowBaseY = 0;

  constructor() {
    super({ key: "DifficultySelectScene" });
  }

  init(data: { vehicle: VehicleType }): void {
    this.vehicle = data.vehicle;
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const viewport = resolveBroadcastViewportContext(
      window.innerWidth,
      window.innerHeight,
      isTouchPrimary(),
    );
    this.compactLayout = viewport.isCompact;
    this.rowWidth = this.compactLayout ? Math.min(700, width * 0.82) : 520;
    this.rowHeight = this.compactLayout ? 88 : 76;
    this.rowStep = this.compactLayout ? 94 : 100;
    this.rowBaseY = this.compactLayout ? height * 0.28 : height * 0.34;
    this.rows = [];
    this.selectedIndex = 0;
    this.transitioning = false;
    this.cameras.main.setBackgroundColor(BC.BG);
    fadeIn(this);

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(BC.RED_DIM, 0.25);
    bgGlow.fillEllipse(width / 2, height * 0.5, width * 0.9, height * 0.7);

    // Accent bars
    const borders = this.add.graphics();
    borders.fillStyle(BC.RED, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    // Chyron
    const chyron = createChyron(
      this,
      48,
      "ZOMBIE THREAT ADVISORY",
      "WZMB 13 EMERGENCY BROADCAST SYSTEM",
      { titleSize: this.compactLayout ? "20px" : "22px" },
    );
    chyron.setX(-width);
    this.tweens.add({
      targets: chyron,
      x: width / 2,
      duration: 350,
      ease: "Quart.easeOut",
    });

    // Instruction
    const touchMode = isTouchPrimary();
    this.add
      .text(
        width / 2,
        height - 28,
        touchMode ? "TAP TO SELECT" : "↑ ↓  SELECT  ·  ENTER  CONFIRM",
        {
          fontFamily: BROADCAST_FONT,
          fontSize: this.compactLayout ? "12px" : "11px",
          fontStyle: "600",
          color: BC.TEXT_MUTED,
          letterSpacing: 2,
        },
      )
      .setOrigin(0.5);

    // Threat rows
    this.difficulties.forEach((diff, i) => {
      const y = this.rowBaseY + i * this.rowStep;
      const info = THREAT_LEVELS[diff];

      // Row background (graphics so we can redraw on selection)
      const bg = this.add.graphics();
      bg.fillStyle(BC.CHROME, 0.95);
      bg.fillRect(
        width / 2 - this.rowWidth / 2,
        y - this.rowHeight / 2,
        this.rowWidth,
        this.rowHeight,
      );
      bg.lineStyle(1, BC.CHROME_EDGE, 0.6);
      bg.strokeRect(
        width / 2 - this.rowWidth / 2,
        y - this.rowHeight / 2,
        this.rowWidth,
        this.rowHeight,
      );

      // Left color band (6px)
      const band = this.add.graphics();
      band.fillStyle(info.color, 1);
      band.fillRect(
        width / 2 - this.rowWidth / 2,
        y - this.rowHeight / 2,
        6,
        this.rowHeight,
      );

      // Threat level label (colored)
      const threatText = this.add
        .text(width / 2 - this.rowWidth / 2 + 24, y - 14, info.threat, {
          fontFamily: BROADCAST_FONT,
          fontSize: this.compactLayout ? "14px" : "13px",
          fontStyle: "800",
          color: info.cssColor,
          letterSpacing: 2,
        })
        .setOrigin(0, 0.5);

      // Difficulty name
      const label = this.add
        .text(width / 2 - 40, y - 14, info.label, {
          fontFamily: BROADCAST_FONT,
          fontSize: this.compactLayout ? "26px" : "24px",
          fontStyle: "800",
          color: BC.TEXT_DIM,
        })
        .setOrigin(0.5, 0.5);

      // Description
      const desc = this.add
        .text(width / 2 - 40, y + 14, info.desc, {
          fontFamily: BROADCAST_FONT,
          fontSize: this.compactLayout ? "13px" : "12px",
          fontStyle: "600",
          color: BC.TEXT_MUTED,
          letterSpacing: 1,
        })
        .setOrigin(0.5, 0.5);

      // Hit area
      const hitArea = this.add
        .rectangle(width / 2, y, this.rowWidth, this.rowHeight, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      this.rows.push({ bg, label, threat: threatText, desc, hitArea, info });

      // Staggered entrance
      [bg, band, threatText, label, desc, hitArea].forEach((el) => {
        if (
          el instanceof Phaser.GameObjects.Text ||
          el instanceof Phaser.GameObjects.Rectangle
        ) {
          el.setAlpha(0);
        }
      });

      this.tweens.add({
        targets: [label, threatText, desc, hitArea],
        alpha: 1,
        duration: 400,
        delay: 300 + i * 100,
        ease: "Quart.easeOut",
      });

      hitArea.on("pointerdown", () => {
        this.selectedIndex = i;
        this.updateSelection();
        this.confirmSelection();
      });
      hitArea.on("pointerover", () => {
        this.selectedIndex = i;
        this.updateSelection();
      });
    });

    this.time.delayedCall(400, () => this.updateSelection());

    // Keyboard
    this.input.keyboard?.on("keydown-UP", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-W", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-S", () => {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-ENTER", () => this.confirmSelection());
    this.input.keyboard?.on("keydown-SPACE", () => this.confirmSelection());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  private updateSelection(): void {
    const { width } = this.cameras.main;

    this.rows.forEach(({ bg, label, desc, info }, i) => {
      const y = this.rowBaseY + i * this.rowStep;
      bg.clear();

      if (i === this.selectedIndex) {
        bg.fillStyle(BC.CHROME_LIT, 1);
        bg.fillRect(
          width / 2 - this.rowWidth / 2,
          y - this.rowHeight / 2,
          this.rowWidth,
          this.rowHeight,
        );
        bg.lineStyle(1, info.color, 0.5);
        bg.strokeRect(
          width / 2 - this.rowWidth / 2,
          y - this.rowHeight / 2,
          this.rowWidth,
          this.rowHeight,
        );
        label.setColor(BC.TEXT);
        desc.setColor(BC.TEXT_DIM);
      } else {
        bg.fillStyle(BC.CHROME, 0.95);
        bg.fillRect(
          width / 2 - this.rowWidth / 2,
          y - this.rowHeight / 2,
          this.rowWidth,
          this.rowHeight,
        );
        bg.lineStyle(1, BC.CHROME_EDGE, 0.6);
        bg.strokeRect(
          width / 2 - this.rowWidth / 2,
          y - this.rowHeight / 2,
          this.rowWidth,
          this.rowHeight,
        );
        label.setColor(BC.TEXT_DIM);
        desc.setColor(BC.TEXT_MUTED);
      }
    });
  }

  private confirmSelection(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    const difficulty = this.difficulties[this.selectedIndex];
    const { width, height } = this.cameras.main;

    // Initialize game state
    const gameState = getOrCreateGameState(this.registry);
    gameState.reset();
    gameState.configure(difficulty, this.vehicle);
    this.registry.set("gameState", gameState);

    // "ADVISORY CONFIRMED" flash
    const confirmText = this.add
      .text(width / 2, height / 2, "ADVISORY CONFIRMED", {
        fontFamily: BROADCAST_FONT,
        fontSize: "26px",
        fontStyle: "800",
        color: BC.TEXT,
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(100);

    this.tweens.add({
      targets: confirmText,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 300,
      onComplete: () => fadeToScene(this, "GameScene"),
    });
  }
}
