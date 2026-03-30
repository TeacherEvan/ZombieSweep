import Phaser from "phaser";
import { VEHICLE_STATS, VehicleType, WeaponSlot } from "../config/vehicles";

export class VehicleSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private vehicles = Object.values(VehicleType);
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "VehicleSelectScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor("#1a0a2e");

    this.add
      .text(width / 2, 40, "CHOOSE YOUR RIDE", {
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const cardWidth = 200;
    const gap = 30;
    const totalWidth =
      this.vehicles.length * cardWidth + (this.vehicles.length - 1) * gap;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.vehicles.forEach((vehicleType, i) => {
      const x = startX + i * (cardWidth + gap);
      const y = height / 2 - 20;
      const card = this.createVehicleCard(x, y, vehicleType, cardWidth);
      this.cards.push(card);
    });

    this.updateSelection();

    // Keyboard
    this.input.keyboard!.on("keydown-LEFT", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-RIGHT", () => {
      this.selectedIndex = Math.min(
        this.vehicles.length - 1,
        this.selectedIndex + 1,
      );
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-A", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-D", () => {
      this.selectedIndex = Math.min(
        this.vehicles.length - 1,
        this.selectedIndex + 1,
      );
      this.updateSelection();
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.confirmSelection();
    });
    this.input.keyboard!.on("keydown-SPACE", () => {
      this.confirmSelection();
    });
  }

  private createVehicleCard(
    x: number,
    y: number,
    vehicleType: VehicleType,
    cardWidth: number,
  ): Phaser.GameObjects.Container {
    const stats = VEHICLE_STATS[vehicleType];
    const container = this.add.container(x, y);

    const bg = this.add
      .rectangle(0, 0, cardWidth, 280, 0x222222)
      .setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      this.selectedIndex = this.vehicles.indexOf(vehicleType);
      this.updateSelection();
      this.confirmSelection();
    });

    const nameText = this.add
      .text(0, -120, vehicleType.replace(/([A-Z])/g, " $1").trim(), {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const statsLines = [
      `Speed: ${"■".repeat(stats.speed)}${"□".repeat(7 - stats.speed)}`,
      `Handling: ${"■".repeat(stats.handling)}${"□".repeat(3 - stats.handling)}`,
      `Stability: ${"■".repeat(stats.stability)}${"□".repeat(3 - stats.stability)}`,
      ``,
      `Melee: ${stats.weapons[WeaponSlot.Melee].name}`,
      `Ranged: ${stats.weapons[WeaponSlot.Ranged].name}`,
    ];

    if (stats.canOllie) {
      statsLines.push("", "✦ Can ollie over holes!");
    }

    const statsText = this.add
      .text(0, -20, statsLines.join("\n"), {
        fontSize: "12px",
        color: "#aaaaaa",
        align: "center",
      })
      .setOrigin(0.5);

    container.add([bg, nameText, statsText]);
    return container;
  }

  private updateSelection(): void {
    this.cards.forEach((card, i) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      if (i === this.selectedIndex) {
        bg.setStrokeStyle(3, 0x8b0000);
      } else {
        bg.setStrokeStyle(0);
      }
    });
  }

  private confirmSelection(): void {
    const vehicle = this.vehicles[this.selectedIndex];
    this.scene.start("DifficultySelectScene", { vehicle });
  }
}
