import Phaser from "phaser";
import { fadeToScene, isTouchPrimary } from "../utils/animations";
import { BC, BROADCAST_FONT, createBroadcastButton } from "./broadcast-styles";
import { resolveBroadcastViewportContext } from "./broadcast-viewport";

export class PauseMenu {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible = false;
  private selectedIndex = 0;
  private buttons: ReturnType<typeof createBroadcastButton>[] = [];
  private confirmingQuit = false;
  private quitBtn!: ReturnType<typeof createBroadcastButton>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;
    const viewport = resolveBroadcastViewportContext(
      window.innerWidth,
      window.innerHeight,
      isTouchPrimary(),
    );
    const scale = viewport.uiScale;

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

    // Scan lines effect — generate a small tileable texture instead of
    // drawing 135 individual lines with lineBetween() calls.
    const scanKey = "__pause_scanlines__";
    if (!this.scene.textures.exists(scanKey)) {
      const sg = this.scene.add.graphics();
      sg.fillStyle(0xffffff, 0.03);
      sg.fillRect(0, 0, 4, 1);
      sg.generateTexture(scanKey, 4, 4);
      sg.destroy();
    }
    const scanLines = this.scene.add.tileSprite(cx, cy, width, height, scanKey);

    // Top / bottom accent bars
    const accents = this.scene.add.graphics();
    accents.fillStyle(BC.RED, 1);
    accents.fillRect(0, cy - 110, width, 3);
    accents.fillRect(0, cy + 110, width, 3);

    // "PLEASE STAND BY" title
    const standByText = this.scene.add
      .text(cx, cy - 70, "PLEASE STAND BY", {
        fontFamily: BROADCAST_FONT,
        fontSize: `${Math.round(32 * scale)}px`,
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
        fontSize: `${Math.round(14 * scale)}px`,
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
        width: Math.round(280 * scale),
        height: Math.round(42 * scale),
        labelSize: `${Math.round(17 * scale)}px`,
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
      cy + Math.round(72 * scale),
      "END TRANSMISSION",
      {
        width: Math.round(280 * scale),
        height: Math.round(42 * scale),
        labelSize: `${Math.round(17 * scale)}px`,
      },
    );
    this.quitBtn = quitBtn;
    quitBtn.hitArea.on("pointerover", () => {
      this.selectedIndex = 1;
      this.updateSelection();
    });
    quitBtn.hitArea.on("pointerdown", () => {
      if (this.confirmingQuit) {
        fadeToScene(this.scene, "WelcomeScene");
      } else {
        this.confirmingQuit = true;
        quitBtn.label.setText("ARE YOU SURE?");
        quitBtn.label.setColor(BC.css.RED);
      }
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
    this.confirmingQuit = false;
    this.quitBtn.label.setText("END TRANSMISSION");
    this.quitBtn.label.setColor(BC.TEXT_DIM);
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
    this.confirmingQuit = false;
    this.quitBtn.label.setText("END TRANSMISSION");
    this.quitBtn.label.setColor(BC.TEXT_DIM);
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
