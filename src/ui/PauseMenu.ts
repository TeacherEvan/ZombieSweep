import Phaser from "phaser";

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

    const overlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7,
    );
    const title = this.scene.add
      .text(width / 2, height / 2 - 80, "PAUSED", {
        fontSize: "36px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const resumeBtn = this.scene.add
      .rectangle(width / 2, height / 2, 200, 50, 0x333333)
      .setInteractive({ useHandCursor: true });
    const resumeText = this.scene.add
      .text(width / 2, height / 2, "Resume", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    resumeBtn.on("pointerdown", () => this.hide());

    const quitBtn = this.scene.add
      .rectangle(width / 2, height / 2 + 70, 200, 50, 0x8b0000)
      .setInteractive({ useHandCursor: true });
    const quitText = this.scene.add
      .text(width / 2, height / 2 + 70, "Quit to Menu", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    quitBtn.on("pointerdown", () => {
      this.scene.scene.start("WelcomeScene");
    });

    this.container.add([
      overlay,
      title,
      resumeBtn,
      resumeText,
      quitBtn,
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
    this.scene.physics.pause();
  }

  hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
    this.scene.physics.resume();
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }
}
