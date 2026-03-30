import Phaser from "phaser";
import { fadeToScene } from "../utils/animations";
import { BC, BROADCAST_FONT, createBroadcastButton } from "./broadcast-styles";

export class PauseMenu {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible = false;
  private selectedIndex = 0;
  private buttons: ReturnType<typeof createBroadcastButton>[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(200);

    // Dark overlay
    const overlay = this.scene.add.rectangle(
      cx,
      cy,
      width,
      height,
      BC.BG,
      0.88,
    );

    // Scan lines effect (subtle horizontal lines)
    const scanLines = this.scene.add.graphics();
    scanLines.lineStyle(1, 0xffffff, 0.03);
    for (let sy = 0; sy < height; sy += 4) {
      scanLines.lineBetween(0, sy, width, sy);
    }

    // Top / bottom accent bars
    const accents = this.scene.add.graphics();
    accents.fillStyle(BC.RED, 1);
    accents.fillRect(0, cy - 110, width, 3);
    accents.fillRect(0, cy + 110, width, 3);

    // "PLEASE STAND BY" title
    const standByText = this.scene.add
      .text(cx, cy - 70, "PLEASE STAND BY", {
        fontFamily: BROADCAST_FONT,
        fontSize: "32px",
        fontStyle: "800",
        color: BC.css.RED,
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0.5);

    // Pulse the standby text
    this.scene.tweens.add({
      targets: standByText,
      alpha: { from: 1, to: 0.5 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle
    const subtitle = this.scene.add
      .text(cx, cy - 40, "TECHNICAL DIFFICULTIES", {
        fontFamily: BROADCAST_FONT,
        fontSize: "14px",
        fontStyle: "600",
        color: BC.TEXT_DIM,
        letterSpacing: 3,
      })
      .setOrigin(0.5, 0.5);

    // Buttons
    const resumeBtn = createBroadcastButton(
      this.scene,
      cx,
      cy + 20,
      "RESUME BROADCAST",
      {
        width: 280,
        height: 42,
      },
    );
    resumeBtn.hitArea.on("pointerover", () => {
      this.selectedIndex = 0;
      this.updateSelection();
    });
    resumeBtn.hitArea.on("pointerdown", () => this.hide());

    const quitBtn = createBroadcastButton(
      this.scene,
      cx,
      cy + 72,
      "END TRANSMISSION",
      {
        width: 280,
        height: 42,
      },
    );
    quitBtn.hitArea.on("pointerover", () => {
      this.selectedIndex = 1;
      this.updateSelection();
    });
    quitBtn.hitArea.on("pointerdown", () => {
      fadeToScene(this.scene, "WelcomeScene");
    });

    this.buttons = [resumeBtn, quitBtn];

    this.container.add([
      overlay,
      scanLines,
      accents,
      standByText,
      subtitle,
      resumeBtn.container,
      quitBtn.container,
    ]);
    this.container.setVisible(false);
  }

  private updateSelection(): void {
    this.buttons.forEach((btn, i) => {
      btn.setSelected(i === this.selectedIndex);
    });
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    this.selectedIndex = 0;
    this.updateSelection();
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
      ease: "Quart.easeOut",
    });
    this.scene.physics.pause();

    // Keyboard nav
    this.scene.input.keyboard?.on("keydown-UP", this.navUp, this);
    this.scene.input.keyboard?.on("keydown-DOWN", this.navDown, this);
    this.scene.input.keyboard?.on("keydown-W", this.navUp, this);
    this.scene.input.keyboard?.on("keydown-S", this.navDown, this);
    this.scene.input.keyboard?.on("keydown-ENTER", this.confirm, this);
    this.scene.input.keyboard?.on("keydown-SPACE", this.confirm, this);
  }

  hide(): void {
    if (!this.isVisible) return;
    // Remove keyboard listeners
    this.scene.input.keyboard?.off("keydown-UP", this.navUp, this);
    this.scene.input.keyboard?.off("keydown-DOWN", this.navDown, this);
    this.scene.input.keyboard?.off("keydown-W", this.navUp, this);
    this.scene.input.keyboard?.off("keydown-S", this.navDown, this);
    this.scene.input.keyboard?.off("keydown-ENTER", this.confirm, this);
    this.scene.input.keyboard?.off("keydown-SPACE", this.confirm, this);

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

  private navUp = (): void => {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    this.updateSelection();
  };

  private navDown = (): void => {
    this.selectedIndex = Math.min(
      this.buttons.length - 1,
      this.selectedIndex + 1,
    );
    this.updateSelection();
  };

  private confirm = (): void => {
    this.buttons[this.selectedIndex]?.hitArea.emit("pointerdown");
  };
}
