import Phaser from "phaser";
import {
  BC,
  BROADCAST_FONT,
  createBroadcastButton,
  createChyron,
} from "../ui/broadcast-styles";
import {
  fadeIn,
  fadeToScene,
  isTouchPrimary,
  prefersReducedMotion,
  pulse,
} from "../utils/animations";

export class WelcomeScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: ReturnType<typeof createBroadcastButton>[] = [];
  private reducedMotion = false;

  constructor() {
    super({ key: "WelcomeScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.selectedIndex = 0;
    this.menuItems = [];
    this.reducedMotion = prefersReducedMotion();

    this.cameras.main.setBackgroundColor(BC.BG);
    fadeIn(this);

    // ── Background: blood-red radial glow, upper-left biased ──
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(BC.RED_DIM, 0.3);
    bgGlow.fillEllipse(width * 0.35, height * 0.3, width * 1.1, height * 0.7);

    // Noise-like texture overlay
    const noiseGfx = this.add.graphics();
    noiseGfx.setAlpha(0.06);
    for (let i = 0; i < 300; i++) {
      const nx = Math.random() * width;
      const ny = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      noiseGfx.fillStyle(0xffffff, Math.random() * 0.4);
      noiseGfx.fillRect(nx, ny, size, size);
    }

    // ── Decorative border bars ──
    const borderBar = this.add.graphics();
    borderBar.fillStyle(BC.RED, 1);
    borderBar.fillRect(0, 0, width, 3);
    borderBar.fillRect(0, height - 3, width, 3);

    // ── Broadcast sweep: subtle signal scan across the screen ──
    const scanline = this.add
      .rectangle(0, -6, width, 2, BC.RED_GLOW, this.reducedMotion ? 0.03 : 0.08)
      .setOrigin(0, 0.5);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: scanline,
        y: height + 6,
        duration: 4800,
        delay: 750,
        repeat: -1,
        ease: "Linear",
      });
    }

    // ── Chyron: title as breaking news slug ──
    const chyron = createChyron(
      this,
      height * 0.58,
      "ZOMBIESWEEP",
      "COURIER DISPATCH OPERATION — TRI-COUNTY ZONE",
      { titleSize: "42px" },
    );
    // Override title color to bc-red
    const titleText = chyron.getAt(2) as Phaser.GameObjects.Text;
    titleText.setColor(BC.css.RED);
    titleText.setShadow(0, 0, BC.css.RED_GLOW, 16, true, true);

    // Slide chyron in from left
    chyron.setX(-width);
    this.tweens.add({
      targets: chyron,
      x: width / 2,
      duration: 400,
      ease: "Quart.easeOut",
    });

    // ── Menu buttons: broadcast-style rows ──
    const menuDefs = [
      { text: "NEW GAME", scene: "VehicleSelectScene" },
      { text: "CONTROLS", action: "controls" },
      { text: "CREDITS", action: "credits" },
    ];

    const btnX = width * 0.08 + 140;
    menuDefs.forEach((item, i) => {
      const by = height * 0.72 + i * 56;
      const btn = createBroadcastButton(this, btnX, by, item.text, {
        width: 280,
        height: 48,
      });
      this.menuItems.push(btn);

      // Staggered entrance from left
      btn.container.setAlpha(0);
      btn.container.setX(btnX - 60);
      this.tweens.add({
        targets: btn.container,
        alpha: 1,
        x: btnX,
        duration: 350,
        delay: 500 + i * 120,
        ease: "Quart.easeOut",
      });

      btn.hitArea.on("pointerover", () => {
        this.selectedIndex = i;
        this.updateMenuSelection(true);
      });
      btn.hitArea.on("pointerdown", () => {
        if (item.scene) {
          fadeToScene(this, item.scene);
        } else if (item.action === "controls") {
          this.showControls(width, height);
        } else if (item.action === "credits") {
          this.showCredits(width, height);
        }
      });
    });

    this.time.delayedCall(600, () => this.updateMenuSelection(true));

    // ── Keyboard navigation ──
    this.input.keyboard!.on("keydown-UP", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateMenuSelection(true);
    });
    this.input.keyboard!.on("keydown-DOWN", () => {
      this.selectedIndex = Math.min(
        menuDefs.length - 1,
        this.selectedIndex + 1,
      );
      this.updateMenuSelection(true);
    });
    this.input.keyboard!.on("keydown-W", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateMenuSelection(true);
    });
    this.input.keyboard!.on("keydown-S", () => {
      this.selectedIndex = Math.min(
        menuDefs.length - 1,
        this.selectedIndex + 1,
      );
      this.updateMenuSelection(true);
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.menuItems[this.selectedIndex]?.hitArea.emit("pointerdown");
    });
    this.input.keyboard!.on("keydown-SPACE", () => {
      this.menuItems[this.selectedIndex]?.hitArea.emit("pointerdown");
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });

    // ── Zombie silhouettes marching across bottom ──
    const zombieY = height - 28;

    this.add
      .text(14, zombieY - 26, "LIVE FIELD CAM", {
        fontFamily: BROADCAST_FONT,
        fontSize: "10px",
        fontStyle: "600",
        color: BC.TEXT_MUTED,
        letterSpacing: 2,
      })
      .setOrigin(0, 0.5);

    for (let z = 0; z < 8; z++) {
      const zx = width + 60 + z * 80;
      const zombieGfx = this.add.graphics();
      zombieGfx.fillStyle(0x2d4a2d, 0.7);
      zombieGfx.fillRoundedRect(-10, -20, 20, 30, 3);
      zombieGfx.fillCircle(0, -28, 10);
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
      this.tweens.add({
        targets: zombieGfx,
        y: zombieY - 3,
        duration: 400 + z * 50,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Ground line
    const groundLine = this.add.graphics();
    groundLine.fillStyle(0x1a2a1a, 1);
    groundLine.fillRect(0, height - 8, width, 8);
    groundLine.fillStyle(0x334433, 0.5);
    groundLine.fillRect(0, height - 10, width, 2);

    // ── Footer: version + prompt ──
    this.add
      .text(14, height - 14, "v0.1.0", {
        fontFamily: BROADCAST_FONT,
        fontSize: "10px",
        fontStyle: "600",
        color: BC.TEXT_MUTED,
      })
      .setOrigin(0, 1);

    const touchMode = isTouchPrimary();
    const prompt = this.add
      .text(
        width - 14,
        height - 14,
        touchMode ? "TAP TO BEGIN" : "PRESS ENTER TO BEGIN",
        {
          fontFamily: BROADCAST_FONT,
          fontSize: "11px",
          fontStyle: "600",
          color: BC.TEXT_MUTED,
          letterSpacing: 2,
        },
      )
      .setOrigin(1, 1);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private updateMenuSelection(animate = false): void {
    this.menuItems.forEach((btn, i) => {
      btn.setSelected(i === this.selectedIndex);
    });

    if (animate && !this.reducedMotion) {
      const selected = this.menuItems[this.selectedIndex];
      if (selected) {
        pulse(this, selected.container, 1.03, 120);
      }
    }
  }

  private showControls(width: number, height: number): void {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.92)
      .setInteractive();

    const headerText = this.add
      .text(width / 2, height * 0.12, "CONTROLS", {
        fontFamily: BROADCAST_FONT,
        fontSize: "32px",
        fontStyle: "800",
        color: BC.css.RED,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const controls = [
      ["WASD / ARROWS", "Move"],
      ["Q", "Throw Paper Left"],
      ["E", "Throw Paper Right"],
      ["SPACE", "Melee Attack"],
      ["F", "Ranged Attack"],
      ["ESC", "Pause"],
    ];

    const startY = height * 0.3;
    const controlTexts: Phaser.GameObjects.Text[] = [];
    controls.forEach(([key, action], i) => {
      const y = startY + i * 36;
      const keyText = this.add
        .text(width / 2 - 100, y, key, {
          fontFamily: BROADCAST_FONT,
          fontSize: "15px",
          fontStyle: "700",
          color: BC.css.GOLD,
        })
        .setOrigin(1, 0.5);
      const actionText = this.add
        .text(width / 2 - 70, y, action, {
          fontFamily: BROADCAST_FONT,
          fontSize: "14px",
          fontStyle: "600",
          color: BC.TEXT_DIM,
        })
        .setOrigin(0, 0.5);
      controlTexts.push(keyText, actionText);
    });

    const closeHint = this.add
      .text(width / 2, height * 0.85, "CLICK TO CLOSE", {
        fontFamily: BROADCAST_FONT,
        fontSize: "12px",
        fontStyle: "600",
        color: BC.TEXT_MUTED,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: closeHint,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    overlay.on("pointerdown", () => {
      overlay.destroy();
      headerText.destroy();
      closeHint.destroy();
      controlTexts.forEach((t) => t.destroy());
    });
  }

  private showCredits(width: number, height: number): void {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.92)
      .setInteractive();

    const title = this.add
      .text(width / 2, height * 0.35, "ZOMBIESWEEP", {
        fontFamily: BROADCAST_FONT,
        fontSize: "36px",
        fontStyle: "800",
        color: BC.css.RED,
      })
      .setOrigin(0.5);

    const credits = this.add
      .text(
        width / 2,
        height * 0.52,
        "Inspired by Paperboy (1985)\n\nBuilt with Phaser 3 + TypeScript",
        {
          fontFamily: BROADCAST_FONT,
          fontSize: "14px",
          fontStyle: "600",
          color: BC.TEXT_DIM,
          align: "center",
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5);

    const closeHint = this.add
      .text(width / 2, height * 0.85, "CLICK TO CLOSE", {
        fontFamily: BROADCAST_FONT,
        fontSize: "12px",
        fontStyle: "600",
        color: BC.TEXT_MUTED,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      title.destroy();
      credits.destroy();
      closeHint.destroy();
    });
  }
}
