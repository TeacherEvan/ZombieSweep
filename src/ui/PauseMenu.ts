import Phaser from "phaser";
import { fadeToScene } from "../utils/animations";

export class PauseMenu {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const { width, height } = this.scene.cameras.main;
    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(200);

    // Dark overlay
    const overlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8,
    );

    // Centered panel
    const panelWidth = 300;
    const panelHeight = 240;
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x141418, 0.95);
    panel.fillRoundedRect(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      8,
    );
    // Top accent bar
    panel.fillStyle(0xcc1100, 1);
    panel.fillRect(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2,
      panelWidth,
      4,
    );

    const title = this.scene.add
      .text(width / 2, height / 2 - 80, "PAUSED", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "38px",
        color: "#cc1100",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ff3300",
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Resume button
    const resumeBg = this.scene.add
      .rectangle(width / 2, height / 2, 220, 48, 0x1a1a1a)
      .setStrokeStyle(2, 0x3d0000)
      .setInteractive({ useHandCursor: true });
    const resumeText = this.scene.add
      .text(width / 2, height / 2, "RESUME", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "22px",
        color: "#aa8877",
      })
      .setOrigin(0.5);

    resumeBg.on("pointerover", () => {
      resumeBg.setFillStyle(0x2a0a08);
      resumeBg.setStrokeStyle(2, 0xcc1100);
      resumeText.setColor("#ffffff");
    });
    resumeBg.on("pointerout", () => {
      resumeBg.setFillStyle(0x1a1a1a);
      resumeBg.setStrokeStyle(2, 0x3d0000);
      resumeText.setColor("#aa8877");
    });
    resumeBg.on("pointerdown", () => this.hide());

    // Quit button
    const quitBg = this.scene.add
      .rectangle(width / 2, height / 2 + 66, 220, 48, 0x1a1a1a)
      .setStrokeStyle(2, 0x330000)
      .setInteractive({ useHandCursor: true });
    const quitText = this.scene.add
      .text(width / 2, height / 2 + 66, "QUIT TO MENU", {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "22px",
        color: "#cc4422",
      })
      .setOrigin(0.5);

    quitBg.on("pointerover", () => {
      quitBg.setFillStyle(0x2a0808);
      quitBg.setStrokeStyle(2, 0xcc1100);
      quitText.setColor("#ff4422");
    });
    quitBg.on("pointerout", () => {
      quitBg.setFillStyle(0x1a1a1a);
      quitBg.setStrokeStyle(2, 0x330000);
      quitText.setColor("#cc4422");
    });
    quitBg.on("pointerdown", () => {
      fadeToScene(this.scene, "WelcomeScene");
    });

    this.container.add([
      overlay,
      panel,
      title,
      resumeBg,
      resumeText,
      quitBg,
      quitText,
    ]);
    this.container.setVisible(false);
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
      ease: "Quart.easeOut",
    });
    this.scene.physics.pause();
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
      ease: "Quart.easeIn",
      onComplete: () => {
        this.isVisible = false;
        this.container.setVisible(false);
        this.scene.physics.resume();
      },
    });
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }
}
