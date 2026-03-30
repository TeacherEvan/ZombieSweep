import Phaser from "phaser";
import { Difficulty } from "../config/difficulty";
import { VehicleType } from "../config/vehicles";
import { GameState } from "../systems/GameState";

export class DifficultySelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private difficulties = Object.values(Difficulty);
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private vehicle!: VehicleType;

  constructor() {
    super({ key: "DifficultySelectScene" });
  }

  init(data: { vehicle: VehicleType }): void {
    this.vehicle = data.vehicle;
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor("#1a0a2e");

    this.add
      .text(width / 2, 50, "SELECT DIFFICULTY", {
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const descriptions: Record<
      string,
      { label: string; desc: string; color: number }
    > = {
      [Difficulty.EasyStreet]: {
        label: "Easy Street",
        desc: "1x Points • Low zombies • Low obstacles",
        color: 0x228b22,
      },
      [Difficulty.MiddleRoad]: {
        label: "Middle Road",
        desc: "2x Points • Medium zombies • Medium obstacles",
        color: 0xdaa520,
      },
      [Difficulty.HardWay]: {
        label: "Hard Way",
        desc: "3x Points • High zombies • High obstacles",
        color: 0x8b0000,
      },
    };

    this.difficulties.forEach((diff, i) => {
      const y = height / 2 - 60 + i * 90;
      const info = descriptions[diff];

      const bg = this.add
        .rectangle(width / 2, y, 400, 70, 0x222222)
        .setInteractive({ useHandCursor: true });
      this.cards.push(bg);

      this.add
        .text(width / 2, y - 12, info.label, {
          fontSize: "22px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, y + 16, info.desc, {
          fontSize: "13px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);

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

    this.updateSelection();

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
    this.cards.forEach((card, i) => {
      card.setStrokeStyle(i === this.selectedIndex ? 3 : 0, 0x8b0000);
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

    this.scene.start("GameScene");
  }
}
