import Phaser from "phaser";
import { VEHICLE_STATS, VehicleType, WeaponSlot } from "../config/vehicles";
import { fadeIn, fadeToScene } from "../utils/animations";

const VEHICLE_COLORS: Record<string, number> = {
  [VehicleType.Bicycle]: 0x22bb44,
  [VehicleType.RollerBlades]: 0x2299dd,
  [VehicleType.Skateboard]: 0xddaa22,
};

export class VehicleSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private vehicles = Object.values(VehicleType);
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "VehicleSelectScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cards = [];
    this.selectedIndex = 0;
    this.cameras.main.setBackgroundColor("#0d0d0d");
    fadeIn(this);

    // Atmospheric background
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0x1a1a2e, 0.5);
    bgGlow.fillEllipse(width / 2, height * 0.45, width, height * 0.8);

    // Top/bottom accent bars
    const borders = this.add.graphics();
    borders.fillStyle(0xcc1100, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    // Title
    this.add
      .text(width / 2, 42, "CHOOSE YOUR RIDE", {
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
      targets: this.children.last,
      alpha: 1,
      y: { from: 20, to: 42 },
      duration: 500,
      ease: "Back.easeOut",
    });

    // Instruction text
    this.add
      .text(width / 2, height - 30, "← →  TO SELECT  ·  ENTER TO CONFIRM", {
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        color: "#555555",
      })
      .setOrigin(0.5);

    const cardWidth = 250;
    const gap = 40;
    const totalWidth =
      this.vehicles.length * cardWidth + (this.vehicles.length - 1) * gap;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.vehicles.forEach((vehicleType, i) => {
      const x = startX + i * (cardWidth + gap);
      const y = height / 2 + 10;
      const card = this.createVehicleCard(x, y, vehicleType, cardWidth, i);
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
    this.input.keyboard!.on("keydown-ENTER", () => this.confirmSelection());
    this.input.keyboard!.on("keydown-SPACE", () => this.confirmSelection());
  }

  private createVehicleCard(
    x: number,
    y: number,
    vehicleType: VehicleType,
    cardWidth: number,
    index: number,
  ): Phaser.GameObjects.Container {
    const stats = VEHICLE_STATS[vehicleType];
    const accentColor = VEHICLE_COLORS[vehicleType] ?? 0xcccccc;
    const container = this.add.container(x, y);

    // Card glow
    const glow = this.add
      .rectangle(0, 0, cardWidth + 12, 320, accentColor, 0)
      .setName("glow");

    // Card background
    const bg = this.add
      .rectangle(0, 0, cardWidth, 310, 0x141418)
      .setStrokeStyle(2, 0x2a2a2a)
      .setInteractive({ useHandCursor: true })
      .setName("bg");

    // Top accent stripe
    const stripe = this.add
      .rectangle(0, -155 + 3, cardWidth, 6, accentColor)
      .setName("stripe");

    bg.on("pointerdown", () => {
      this.selectedIndex = this.vehicles.indexOf(vehicleType);
      this.updateSelection();
      this.confirmSelection();
    });
    bg.on("pointerover", () => {
      this.selectedIndex = this.vehicles.indexOf(vehicleType);
      this.updateSelection();
    });

    // Vehicle name
    const name = vehicleType
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toUpperCase();
    const nameText = this.add
      .text(0, -120, name, {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setName("name");

    // Stat bars (visual, not text)
    const barStartY = -70;
    const statLabels = ["SPEED", "HANDLING", "STABILITY"];
    const statValues = [stats.speed, stats.handling, stats.stability];
    const statMaxes = [7, 3, 3];

    const statElements: Phaser.GameObjects.GameObject[] = [];
    statLabels.forEach((label, si) => {
      const sy = barStartY + si * 32;
      const labelText = this.add
        .text(-100, sy, label, {
          fontFamily: "'Courier New', monospace",
          fontSize: "10px",
          color: "#777777",
        })
        .setOrigin(0, 0.5);

      // Bar background
      const barBg = this.add.rectangle(20, sy, 120, 10, 0x222222);
      const fillWidth = (statValues[si] / statMaxes[si]) * 120;
      const barFill = this.add
        .rectangle(20 - 60 + fillWidth / 2, sy, fillWidth, 10, accentColor)
        .setAlpha(0.8);

      statElements.push(labelText, barBg, barFill);
    });

    // Weapons
    const weaponY = barStartY + 110;
    const meleeLabel = this.add
      .text(0, weaponY, `⚔ ${stats.weapons[WeaponSlot.Melee].name}`, {
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        color: "#cc8866",
      })
      .setOrigin(0.5);
    const rangedLabel = this.add
      .text(0, weaponY + 22, `🎯 ${stats.weapons[WeaponSlot.Ranged].name}`, {
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        color: "#cc8866",
      })
      .setOrigin(0.5);

    // Special ability
    const specialElements: Phaser.GameObjects.Text[] = [];
    if (stats.canOllie) {
      const special = this.add
        .text(0, weaponY + 50, "★ CAN OLLIE OVER HOLES", {
          fontFamily: "'Courier New', monospace",
          fontSize: "10px",
          color: "#ddaa22",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      specialElements.push(special);
    }

    container.add([
      glow,
      bg,
      stripe,
      nameText,
      ...statElements,
      meleeLabel,
      rangedLabel,
      ...specialElements,
    ]);

    // Entrance animation
    container.setAlpha(0);
    container.setY(y + 40);
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 500,
      delay: 200 + index * 120,
      ease: "Back.easeOut",
    });

    return container;
  }

  private updateSelection(): void {
    this.cards.forEach((card, i) => {
      const glow = card.getByName("glow") as Phaser.GameObjects.Rectangle;
      const bg = card.getByName("bg") as Phaser.GameObjects.Rectangle;
      const stripe = card.getByName("stripe") as Phaser.GameObjects.Rectangle;

      if (i === this.selectedIndex) {
        bg.setStrokeStyle(2, 0xcc1100);
        glow.setAlpha(0.15);
        stripe.setAlpha(1);
        this.tweens.killTweensOf(card);
        this.tweens.add({
          targets: card,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 250,
          ease: "Back.easeOut",
        });
      } else {
        bg.setStrokeStyle(2, 0x2a2a2a);
        glow.setAlpha(0);
        stripe.setAlpha(0.4);
        this.tweens.killTweensOf(card);
        this.tweens.add({
          targets: card,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 200,
          ease: "Power2",
        });
      }
    });
  }

  private confirmSelection(): void {
    const vehicle = this.vehicles[this.selectedIndex];
    const card = this.cards[this.selectedIndex];

    // Flash confirmation
    this.tweens.add({
      targets: card,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 120,
      yoyo: true,
      onComplete: () => {
        fadeToScene(this, "DifficultySelectScene", { vehicle });
      },
    });
  }
}
