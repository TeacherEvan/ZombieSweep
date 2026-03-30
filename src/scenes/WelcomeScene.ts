import Phaser from "phaser";

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "WelcomeScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.cameras.main.setBackgroundColor("#1a0a2e");

    // Title
    this.add
      .text(width / 2, height / 4, "ZOMBIESWEEP", {
        fontSize: "48px",
        color: "#8b0000",
        fontStyle: "bold",
        shadow: { offsetX: 3, offsetY: 3, color: "#000", blur: 5, fill: true },
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(
        width / 2,
        height / 4 + 60,
        "Deliver papers. Kill zombies. Survive.",
        {
          fontSize: "16px",
          color: "#cccccc",
        },
      )
      .setOrigin(0.5);

    // Menu buttons
    const menuItems = [
      { text: "New Game", scene: "VehicleSelectScene" },
      { text: "Controls", action: "controls" },
      { text: "Credits", action: "credits" },
    ];

    menuItems.forEach((item, i) => {
      const y = height / 2 + i * 70;
      const btn = this.add
        .rectangle(width / 2, y, 240, 50, 0x333333)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(width / 2, y, item.text, {
          fontSize: "22px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      btn.on("pointerover", () => {
        btn.setFillStyle(0x8b0000);
      });
      btn.on("pointerout", () => {
        btn.setFillStyle(0x333333);
      });
      btn.on("pointerdown", () => {
        if (item.scene) {
          this.scene.start(item.scene);
        } else if (item.action === "controls") {
          this.showControls(width, height);
        } else if (item.action === "credits") {
          this.showCredits(width, height);
        }
      });

      // Keyboard support — store refs for index selection
      txt.setData("index", i);
    });

    // Animated zombie text at bottom
    const zombieText = this.add.text(
      width + 100,
      height - 40,
      "🧟 🧟 🧟 🧟 🧟",
      {
        fontSize: "32px",
      },
    );
    this.tweens.add({
      targets: zombieText,
      x: -200,
      duration: 8000,
      repeat: -1,
    });
  }

  private showControls(width: number, height: number): void {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
      .setInteractive();
    const lines = [
      "CONTROLS",
      "",
      "WASD / Arrow Keys — Move",
      "Q — Throw Paper Left",
      "E — Throw Paper Right",
      "SPACE — Melee Attack",
      "F — Ranged Attack",
      "ESC — Pause",
      "",
      "[Click anywhere to close]",
    ];
    const text = this.add
      .text(width / 2, height / 2, lines.join("\n"), {
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      text.destroy();
    });
  }

  private showCredits(width: number, height: number): void {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
      .setInteractive();
    const text = this.add
      .text(
        width / 2,
        height / 2,
        "ZombieSweep\n\nInspired by Paperboy (1985)\n\nBuilt with Phaser 3 + TypeScript\n\n[Click to close]",
        {
          fontSize: "18px",
          color: "#ffffff",
          align: "center",
        },
      )
      .setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      text.destroy();
    });
  }
}
