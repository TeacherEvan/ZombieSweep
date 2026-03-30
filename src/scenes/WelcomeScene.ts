import Phaser from "phaser";

export class WelcomeScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuButtons: {
    bg: Phaser.GameObjects.Rectangle;
    txt: Phaser.GameObjects.Text;
    glow: Phaser.GameObjects.Rectangle;
  }[] = [];

  constructor() {
    super({ key: "WelcomeScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.selectedIndex = 0;
    this.menuButtons = [];

    // ── Background: deep dark with vignette effect ──
    this.cameras.main.setBackgroundColor("#0d0d0d");

    // Atmospheric background layers — blood-red radial glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0x3d0000, 0.4);
    bgGlow.fillEllipse(width / 2, height / 3, width * 1.2, height * 0.8);
    bgGlow.fillStyle(0x1a0808, 0.6);
    bgGlow.fillEllipse(width / 2, height / 3, width * 0.8, height * 0.5);

    // Noise-like texture overlay with scattered dots
    const noiseGfx = this.add.graphics();
    noiseGfx.setAlpha(0.08);
    for (let i = 0; i < 300; i++) {
      const nx = Math.random() * width;
      const ny = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      noiseGfx.fillStyle(0xffffff, Math.random() * 0.5);
      noiseGfx.fillRect(nx, ny, size, size);
    }

    // ── Decorative border: thick red bars top/bottom ──
    const borderBar = this.add.graphics();
    borderBar.fillStyle(0xcc1100, 1);
    borderBar.fillRect(0, 0, width, 4);
    borderBar.fillRect(0, height - 4, width, 4);
    borderBar.fillStyle(0x660900, 1);
    borderBar.fillRect(0, 4, width, 2);
    borderBar.fillRect(0, height - 6, width, 2);

    // ── Title: MASSIVE, dramatic ──
    const titleShadow = this.add
      .text(width / 2 + 4, height * 0.18 + 4, "ZOMBIESWEEP", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "84px",
        color: "#000000",
      })
      .setOrigin(0.5)
      .setAlpha(0.5);

    const title = this.add
      .text(width / 2, height * 0.18, "ZOMBIESWEEP", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "84px",
        color: "#cc1100",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ff3300",
          blur: 20,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Title pulse animation
    this.tweens.add({
      targets: title,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: titleShadow,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── Subtitle with dramatic tracking ──
    const subtitle = this.add
      .text(
        width / 2,
        height * 0.32,
        "D E L I V E R   P A P E R S .   K I L L   Z O M B I E S .   S U R V I V E .",
        {
          fontFamily: "'Courier New', monospace",
          fontSize: "13px",
          color: "#bb4422",
          letterSpacing: 1,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    // Subtitle fade-in
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1200,
      delay: 400,
      ease: "Power2",
    });

    // ── Menu buttons: chunky, bold, staggered entrance ──
    const menuItems = [
      { text: "NEW GAME", scene: "VehicleSelectScene" },
      { text: "CONTROLS", action: "controls" },
      { text: "CREDITS", action: "credits" },
    ];

    menuItems.forEach((item, i) => {
      const y = height * 0.5 + i * 72;
      const btnWidth = 280;
      const btnHeight = 54;

      // Glow behind button (hidden until hover)
      const glow = this.add
        .rectangle(width / 2, y, btnWidth + 16, btnHeight + 12, 0xcc1100, 0)
        .setDepth(0);

      // Button background
      const bg = this.add
        .rectangle(width / 2, y, btnWidth, btnHeight, 0x1a1a1a)
        .setStrokeStyle(2, 0x3d0000)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0);

      const txt = this.add
        .text(width / 2, y, item.text, {
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: "26px",
          color: "#aa8877",
        })
        .setOrigin(0.5)
        .setAlpha(0);

      this.menuButtons.push({ bg, txt, glow });

      // Staggered entrance animation
      this.tweens.add({
        targets: [bg, txt],
        alpha: 1,
        y: { from: y + 30, to: y },
        duration: 500,
        delay: 600 + i * 120,
        ease: "Back.easeOut",
      });

      bg.on("pointerover", () => {
        this.selectedIndex = i;
        this.updateMenuSelection();
      });
      bg.on("pointerout", () => {
        this.updateMenuSelection();
      });
      bg.on("pointerdown", () => {
        this.flashAndGo(bg, () => {
          if (item.scene) {
            this.scene.start(item.scene);
          } else if (item.action === "controls") {
            this.showControls(width, height);
          } else if (item.action === "credits") {
            this.showCredits(width, height);
          }
        });
      });
    });

    // Initial selection state
    this.time.delayedCall(800, () => this.updateMenuSelection());

    // ── Keyboard navigation ──
    this.input.keyboard!.on("keydown-UP", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateMenuSelection();
    });
    this.input.keyboard!.on("keydown-DOWN", () => {
      this.selectedIndex = Math.min(
        menuItems.length - 1,
        this.selectedIndex + 1,
      );
      this.updateMenuSelection();
    });
    this.input.keyboard!.on("keydown-W", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateMenuSelection();
    });
    this.input.keyboard!.on("keydown-S", () => {
      this.selectedIndex = Math.min(
        menuItems.length - 1,
        this.selectedIndex + 1,
      );
      this.updateMenuSelection();
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.menuButtons[this.selectedIndex]?.bg.emit("pointerdown");
    });
    this.input.keyboard!.on("keydown-SPACE", () => {
      this.menuButtons[this.selectedIndex]?.bg.emit("pointerdown");
    });

    // ── Animated zombie silhouettes marching across bottom ──
    const zombieY = height - 28;
    for (let z = 0; z < 8; z++) {
      const zx = width + 60 + z * 80;
      const zombieGfx = this.add.graphics();
      // Simple zombie silhouette using shapes
      zombieGfx.fillStyle(0x2d4a2d, 0.7);
      zombieGfx.fillRoundedRect(-10, -20, 20, 30, 3);
      zombieGfx.fillCircle(0, -28, 10);
      // Arms reaching forward
      zombieGfx.fillStyle(0x2d4a2d, 0.5);
      zombieGfx.fillRect(10, -15, 14, 4);
      zombieGfx.fillRect(10, -8, 12, 4);
      zombieGfx.setPosition(zx, zombieY);

      this.tweens.add({
        targets: zombieGfx,
        x: -80,
        duration: 12000 + z * 400,
        repeat: -1,
        delay: z * 200,
        ease: "Linear",
      });

      // Shambling bob
      this.tweens.add({
        targets: zombieGfx,
        y: zombieY - 3,
        duration: 400 + z * 50,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // ── Ground line at bottom ──
    const groundLine = this.add.graphics();
    groundLine.fillStyle(0x1a2a1a, 1);
    groundLine.fillRect(0, height - 8, width, 8);
    groundLine.fillStyle(0x334433, 0.5);
    groundLine.fillRect(0, height - 10, width, 2);

    // ── Version text ──
    this.add
      .text(width - 10, height - 14, "v0.1.0", {
        fontFamily: "'Courier New', monospace",
        fontSize: "10px",
        color: "#333333",
      })
      .setOrigin(1, 1);
  }

  private updateMenuSelection(): void {
    this.menuButtons.forEach(({ bg, txt, glow }, i) => {
      if (i === this.selectedIndex) {
        bg.setFillStyle(0x2a0a08);
        bg.setStrokeStyle(2, 0xcc1100);
        txt.setColor("#ffffff");
        glow.setFillStyle(0xcc1100, 0.15);
        this.tweens.killTweensOf(txt);
        txt.setScale(1);
        this.tweens.add({
          targets: txt,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 300,
          ease: "Back.easeOut",
        });
      } else {
        bg.setFillStyle(0x1a1a1a);
        bg.setStrokeStyle(2, 0x3d0000);
        txt.setColor("#aa8877");
        glow.setFillStyle(0xcc1100, 0);
        this.tweens.killTweensOf(txt);
        txt.setScale(1);
      }
    });
  }

  private flashAndGo(
    target: Phaser.GameObjects.Rectangle,
    callback: () => void,
  ): void {
    this.tweens.add({
      targets: target,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => callback(),
    });
  }

  private showControls(width: number, height: number): void {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
      .setInteractive();

    const headerText = this.add
      .text(width / 2, height * 0.15, "CONTROLS", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "36px",
        color: "#cc1100",
      })
      .setOrigin(0.5);

    const controls = [
      ["WASD / Arrows", "Move"],
      ["Q", "Throw Paper Left"],
      ["E", "Throw Paper Right"],
      ["SPACE", "Melee Attack"],
      ["F", "Ranged Attack"],
      ["ESC", "Pause"],
    ];

    const startY = height * 0.32;
    controls.forEach(([key, action], i) => {
      const y = startY + i * 36;
      this.add
        .text(width / 2 - 120, y, key, {
          fontFamily: "'Courier New', monospace",
          fontSize: "16px",
          color: "#cc8866",
          fontStyle: "bold",
        })
        .setOrigin(1, 0.5);
      this.add
        .text(width / 2 - 90, y, action, {
          fontFamily: "'Courier New', monospace",
          fontSize: "15px",
          color: "#888888",
        })
        .setOrigin(0, 0.5);
    });

    const closeHint = this.add
      .text(width / 2, height * 0.85, "[ CLICK TO CLOSE ]", {
        fontFamily: "'Courier New', monospace",
        fontSize: "13px",
        color: "#555555",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: closeHint,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    overlay.on("pointerdown", () => {
      overlay.destroy();
      headerText.destroy();
      closeHint.destroy();
      controls.forEach(() => {}); // cleanup handled by scene
      // Destroy all text objects created for controls
      this.children.list
        .filter(
          (c) =>
            c instanceof Phaser.GameObjects.Text &&
            (c as Phaser.GameObjects.Text).y >= startY - 10 &&
            (c as Phaser.GameObjects.Text).y <=
              startY + controls.length * 36 + 10,
        )
        .forEach((c) => c.destroy());
    });
  }

  private showCredits(width: number, height: number): void {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
      .setInteractive();

    const text = this.add
      .text(width / 2, height * 0.35, "ZOMBIESWEEP", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "36px",
        color: "#cc1100",
        align: "center",
      })
      .setOrigin(0.5);

    const credits = this.add
      .text(
        width / 2,
        height * 0.52,
        "Inspired by Paperboy (1985)\n\nBuilt with Phaser 3 + TypeScript",
        {
          fontFamily: "'Courier New', monospace",
          fontSize: "15px",
          color: "#777777",
          align: "center",
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5);

    const closeHint = this.add
      .text(width / 2, height * 0.85, "[ CLICK TO CLOSE ]", {
        fontFamily: "'Courier New', monospace",
        fontSize: "13px",
        color: "#555555",
      })
      .setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      text.destroy();
      credits.destroy();
      closeHint.destroy();
    });
  }
}
