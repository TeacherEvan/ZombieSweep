import Phaser from "phaser";
import { Difficulty } from "../config/difficulty";
import { VehicleType } from "../config/vehicles";
import { GameState } from "../systems/GameState";

const DIFF_STYLES: Record<
  string,
  { label: string; desc: string; color: number; icon: string }
> = {
  [Difficulty.EasyStreet]: {
    label: "EASY STREET",
    desc: "1× Points  ·  Low zombies  ·  Low obstacles",
    color: 0x22aa44,
    icon: "☠",
  },
  [Difficulty.MiddleRoad]: {
    label: "MIDDLE ROAD",
    desc: "2× Points  ·  Medium zombies  ·  Medium obstacles",
    color: 0xcc8822,
    icon: "☠☠",
  },
  [Difficulty.HardWay]: {
    label: "THE HARD WAY",
    desc: "3× Points  ·  High zombies  ·  High obstacles",
    color: 0xcc1100,
    icon: "☠☠☠",
  },
};

export class DifficultySelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private difficulties = Object.values(Difficulty);
  private rows: {
    bg: Phaser.GameObjects.Rectangle;
    glow: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }[] = [];
  private vehicle!: VehicleType;

  constructor() {
    super({ key: "DifficultySelectScene" });
  }

  init(data: { vehicle: VehicleType }): void {
    this.vehicle = data.vehicle;
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.rows = [];
    this.selectedIndex = 0;
    this.cameras.main.setBackgroundColor("#0d0d0d");

    // Atmospheric glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0x1a0808, 0.4);
    bgGlow.fillEllipse(width / 2, height * 0.5, width * 0.9, height * 0.7);

    // Accent bars
    const borders = this.add.graphics();
    borders.fillStyle(0xcc1100, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    // Title
    const title = this.add
      .text(width / 2, 48, "SELECT DIFFICULTY", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "42px",
        color: "#cc1100",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ff3300",
          blur: 12,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: { from: 25, to: 48 },
      duration: 500,
      ease: "Back.easeOut",
    });

    // Instruction
    this.add
      .text(width / 2, height - 28, "↑ ↓  TO SELECT  ·  ENTER TO CONFIRM", {
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        color: "#555555",
      })
      .setOrigin(0.5);

    // Difficulty rows
    this.difficulties.forEach((diff, i) => {
      const y = height * 0.35 + i * 100;
      const info = DIFF_STYLES[diff];
      const rowWidth = 480;
      const rowHeight = 76;

      // Glow behind
      const glow = this.add.rectangle(
        width / 2,
        y,
        rowWidth + 10,
        rowHeight + 8,
        info.color,
        0,
      );

      // Row background
      const bg = this.add
        .rectangle(width / 2, y, rowWidth, rowHeight, 0x141418)
        .setStrokeStyle(2, 0x2a2a2a)
        .setInteractive({ useHandCursor: true });

      // Left color accent bar
      const accentBar = this.add.graphics();
      accentBar.fillStyle(info.color, 1);
      accentBar.fillRect(
        width / 2 - rowWidth / 2,
        y - rowHeight / 2,
        5,
        rowHeight,
      );

      // Skull icons on left
      this.add
        .text(width / 2 - rowWidth / 2 + 24, y - 6, info.icon, {
          fontSize: "18px",
          color: `#${info.color.toString(16).padStart(6, "0")}`,
        })
        .setOrigin(0, 0.5);

      // Label
      const label = this.add
        .text(width / 2 - 40, y - 14, info.label, {
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: "24px",
          color: "#aa8877",
        })
        .setOrigin(0.5, 0.5);

      // Description
      this.add
        .text(width / 2 - 40, y + 14, info.desc, {
          fontFamily: "'Courier New', monospace",
          fontSize: "11px",
          color: "#666666",
        })
        .setOrigin(0.5, 0.5);

      this.rows.push({ bg, glow, label });

      // Staggered entrance
      const rowGroup = [bg, glow, accentBar, label];
      rowGroup.forEach((el) => {
        if (
          el instanceof Phaser.GameObjects.Rectangle ||
          el instanceof Phaser.GameObjects.Text
        ) {
          el.setAlpha(0);
        }
      });

      this.tweens.add({
        targets: [bg, glow, label],
        alpha: 1,
        y: { from: y + 20, to: y },
        duration: 400,
        delay: 300 + i * 100,
        ease: "Back.easeOut",
      });

      bg.on("pointerdown", () => {
        this.selectedIndex = i;
        this.updateSelection();
        this.confirmSelection();
      });
      bg.on("pointerover", () => {
        this.selectedIndex = i;
        this.updateSelection();
      });
    });

    this.time.delayedCall(400, () => this.updateSelection());

    this.input.keyboard!.on("keydown-UP", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-DOWN", () => {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-W", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-S", () => {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-ENTER", () => this.confirmSelection());
    this.input.keyboard!.on("keydown-SPACE", () => this.confirmSelection());
  }

  private updateSelection(): void {
    this.rows.forEach(({ bg, glow, label }, i) => {
      const info = DIFF_STYLES[this.difficulties[i]];
      if (i === this.selectedIndex) {
        bg.setFillStyle(0x1e1218);
        bg.setStrokeStyle(2, info.color);
        glow.setFillStyle(info.color, 0.12);
        label.setColor("#ffffff");
        this.tweens.killTweensOf(bg);
        this.tweens.add({
          targets: bg,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 200,
          ease: "Back.easeOut",
        });
      } else {
        bg.setFillStyle(0x141418);
        bg.setStrokeStyle(2, 0x2a2a2a);
        glow.setFillStyle(info.color, 0);
        label.setColor("#aa8877");
        this.tweens.killTweensOf(bg);
        this.tweens.add({
          targets: bg,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: "Power2",
        });
      }
    });
  }

  private confirmSelection(): void {
    const difficulty = this.difficulties[this.selectedIndex];

    // Initialize game state
    const gameState =
      (this.registry.get("gameState") as GameState) || new GameState();
    gameState.reset();
    gameState.configure(difficulty, this.vehicle);
    this.registry.set("gameState", gameState);

    // Flash and transition
    const { bg } = this.rows[this.selectedIndex];
    this.tweens.add({
      targets: bg,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.scene.start("GameScene"),
    });
  }
}
