import Phaser from "phaser";
import { VEHICLE_STATS, VehicleType, WeaponSlot } from "../config/vehicles";
import { BC, BROADCAST_FONT, createChyron } from "../ui/broadcast-styles";
import { fadeIn, fadeToScene, isTouchPrimary } from "../utils/animations";

const VEHICLE_COLORS: Record<string, number> = {
  [VehicleType.Bicycle]: 0x22bb44,
  [VehicleType.RollerBlades]: 0x2299dd,
  [VehicleType.Skateboard]: 0xddaa22,
};

export class VehicleSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private vehicles = Object.values(VehicleType);
  private cards: Phaser.GameObjects.Container[] = [];
  private transitioning = false;

  constructor() {
    super({ key: "VehicleSelectScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cards = [];
    this.selectedIndex = 0;
    this.transitioning = false;
    this.cameras.main.setBackgroundColor(BC.BG);
    fadeIn(this);

    // Atmospheric background
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(BC.CHROME_LIT, 0.4);
    bgGlow.fillEllipse(width / 2, height * 0.45, width, height * 0.8);

    // Top/bottom bars
    const borders = this.add.graphics();
    borders.fillStyle(BC.RED, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    // Chyron
    const chyron = createChyron(
      this,
      48,
      "FLEET STATUS: AVAILABLE UNITS",
      "SELECT DISPATCH VEHICLE",
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
        touchMode ? "TAP TO SELECT" : "← →  SELECT  ·  ENTER  CONFIRM",
        {
          fontFamily: BROADCAST_FONT,
          fontSize: "11px",
          fontStyle: "600",
          color: BC.TEXT_MUTED,
          letterSpacing: 2,
        },
      )
      .setOrigin(0.5);

    // Vehicle cards
    const cardWidth = 250;
    const gap = 30;
    const totalWidth =
      this.vehicles.length * cardWidth + (this.vehicles.length - 1) * gap;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.vehicles.forEach((vehicleType, i) => {
      const x = startX + i * (cardWidth + gap);
      const y = height / 2 + 20;
      const card = this.createVehicleCard(x, y, vehicleType, cardWidth, i);
      this.cards.push(card);
    });

    this.updateSelection();

    // Keyboard
    this.input.keyboard?.on("keydown-LEFT", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-RIGHT", () => {
      this.selectedIndex = Math.min(
        this.vehicles.length - 1,
        this.selectedIndex + 1,
      );
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-A", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-D", () => {
      this.selectedIndex = Math.min(
        this.vehicles.length - 1,
        this.selectedIndex + 1,
      );
      this.updateSelection();
    });
    this.input.keyboard?.on("keydown-ENTER", () => this.confirmSelection());
    this.input.keyboard?.on("keydown-SPACE", () => this.confirmSelection());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  private createVehicleCard(
    x: number,
    y: number,
    vehicleType: VehicleType,
    cardWidth: number,
    index: number,
  ): Phaser.GameObjects.Container {
    const stats = VEHICLE_STATS[vehicleType];
    const accentColor = VEHICLE_COLORS[vehicleType] ?? BC.CHROME_EDGE;
    const container = this.add.container(x, y);

    const cardHeight = 310;

    // Card background
    const bg = this.add.graphics().setName("bg");
    bg.fillStyle(BC.CHROME, 0.95);
    bg.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
    bg.lineStyle(1, BC.CHROME_EDGE, 1);
    bg.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);

    // Left accent bar — vehicle color
    const accentBar = this.add.graphics().setName("accent");
    accentBar.fillStyle(accentColor, 1);
    accentBar.fillRect(-cardWidth / 2, -cardHeight / 2, 4, cardHeight);

    // Hit area
    const hitArea = this.add
      .rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setName("hitArea");

    hitArea.on("pointerdown", () => {
      this.selectedIndex = this.vehicles.indexOf(vehicleType);
      this.updateSelection();
      this.confirmSelection();
    });
    hitArea.on("pointerover", () => {
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
        fontFamily: BROADCAST_FONT,
        fontSize: "20px",
        fontStyle: "800",
        color: BC.TEXT,
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setName("name");

    // Stat bars
    const barStartY = -70;
    const statLabels = ["SPEED", "HANDLING", "STABILITY"];
    const statValues = [stats.speed, stats.handling, stats.stability];
    const statMaxes = [7, 3, 3];

    const statElements: Phaser.GameObjects.GameObject[] = [];
    statLabels.forEach((label, si) => {
      const sy = barStartY + si * 32;
      const labelText = this.add
        .text(-100, sy, label, {
          fontFamily: BROADCAST_FONT,
          fontSize: "10px",
          fontStyle: "600",
          color: BC.TEXT_DIM,
          letterSpacing: 2,
        })
        .setOrigin(0, 0.5);

      // Bar track
      const barBg = this.add.rectangle(20, sy, 120, 8, BC.CHROME_EDGE);
      const fillWidth = (statValues[si] / statMaxes[si]) * 120;
      const barFill = this.add
        .rectangle(20 - 60 + fillWidth / 2, sy, fillWidth, 8, accentColor)
        .setAlpha(0.85);

      statElements.push(labelText, barBg, barFill);
    });

    // Weapons
    const weaponY = barStartY + 110;
    const meleeLabel = this.add
      .text(0, weaponY, `⚔ ${stats.weapons[WeaponSlot.Melee].name}`, {
        fontFamily: BROADCAST_FONT,
        fontSize: "12px",
        fontStyle: "600",
        color: BC.css.GOLD_DIM,
      })
      .setOrigin(0.5);
    const rangedLabel = this.add
      .text(0, weaponY + 22, `🎯 ${stats.weapons[WeaponSlot.Ranged].name}`, {
        fontFamily: BROADCAST_FONT,
        fontSize: "12px",
        fontStyle: "600",
        color: BC.css.GOLD_DIM,
      })
      .setOrigin(0.5);

    // Special ability
    const specialElements: Phaser.GameObjects.Text[] = [];
    if (stats.canOllie) {
      const special = this.add
        .text(0, weaponY + 50, "★ CAN OLLIE OVER HOLES", {
          fontFamily: BROADCAST_FONT,
          fontSize: "10px",
          fontStyle: "700",
          color: BC.css.GOLD,
          letterSpacing: 1,
        })
        .setOrigin(0.5);
      specialElements.push(special);
    }

    container.add([
      bg,
      accentBar,
      hitArea,
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
      duration: 450,
      delay: 200 + index * 120,
      ease: "Quart.easeOut",
    });

    return container;
  }

  private updateSelection(): void {
    this.cards.forEach((card, i) => {
      const bg = card.getByName("bg") as Phaser.GameObjects.Graphics;

      if (i === this.selectedIndex) {
        // Redraw bg with red border
        bg.clear();
        const cw = 250;
        const ch = 310;
        bg.fillStyle(BC.CHROME_LIT, 0.95);
        bg.fillRect(-cw / 2, -ch / 2, cw, ch);
        bg.lineStyle(2, BC.RED, 1);
        bg.strokeRect(-cw / 2, -ch / 2, cw, ch);

        this.tweens.killTweensOf(card);
        this.tweens.add({
          targets: card,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 200,
          ease: "Quart.easeOut",
        });
        card.setAlpha(1);
      } else {
        bg.clear();
        const cw = 250;
        const ch = 310;
        bg.fillStyle(BC.CHROME, 0.95);
        bg.fillRect(-cw / 2, -ch / 2, cw, ch);
        bg.lineStyle(1, BC.CHROME_EDGE, 1);
        bg.strokeRect(-cw / 2, -ch / 2, cw, ch);

        this.tweens.killTweensOf(card);
        this.tweens.add({
          targets: card,
          scaleX: 0.97,
          scaleY: 0.97,
          duration: 150,
          ease: "Power2",
        });
        card.setAlpha(0.7);
      }
    });
  }

  private confirmSelection(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    const vehicle = this.vehicles[this.selectedIndex];
    const card = this.cards[this.selectedIndex];
    const { width, height } = this.cameras.main;

    // "DISPATCHING..." flash
    const dispatchText = this.add
      .text(width / 2, height / 2, "DISPATCHING...", {
        fontFamily: BROADCAST_FONT,
        fontSize: "28px",
        fontStyle: "800",
        color: BC.TEXT,
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(100);

    this.tweens.add({
      targets: card,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 120,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: dispatchText,
          alpha: 1,
          duration: 200,
          onComplete: () => {
            fadeToScene(this, "DifficultySelectScene", { vehicle });
          },
        });
      },
    });
  }
}
